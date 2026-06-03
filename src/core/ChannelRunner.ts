import ChannelRegistry from "./ChannelRegistry";
import InputMapper from "./InputMapper";
import ResponseNormalizer from "./ResponseNormalizer";
import TaskPoller from "./TaskPoller";
import HttpClient from "./HttpClient";
import FileSaver from "./FileSaver";
import ThumbnailGenerator from "./ThumbnailGenerator";
import type {
  Channel,
  TaskDefinition,
  ExecutionInput,
  OutputConfig,
  ExecutionResult,
  ImageSource,
  NormalizedAsset,
} from "./types";

export class ChannelRunner {
  static async execute(
    input: ExecutionInput,
    outputConfig: OutputConfig,
    channelCredentials: Map<string, string>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    try {
      const channel = ChannelRegistry.get(input.channelId);
      if (!channel) throw new Error(`Channel not found: ${input.channelId}`);

      const task = channel.tasks.find((t) => t.type === input.taskType);
      if (!task) throw new Error(`Task not supported: ${input.taskType}`);

      const mappedInput = InputMapper.map(input, channel.inputMapping, task.paramSchema);
      const apiKey = channelCredentials.get(input.channelId);
      const headers = this.buildHeaders(channel, apiKey, task.requestType);

      let rawResponse: unknown;

      switch (task.callMode) {
        case "openai_sync":
          rawResponse = await this.callOpenAISync(channel, task, mappedInput, headers);
          break;
        case "multipart_sync":
          rawResponse = await this.callMultipartSync(channel, task, mappedInput, input.inputImages, headers);
          break;
        case "async_poll":
          rawResponse = await this.callAsyncPoll(channel, task, mappedInput, input.inputImages, headers, apiKey);
          break;
        default:
          rawResponse = await this.callOpenAISync(channel, task, mappedInput, headers);
      }

      const assets = ResponseNormalizer.normalize(rawResponse, task.responseMode);
      const { files, thumbnails, savedPaths } = await this.saveAssets(assets, input, outputConfig);

      return {
        status: "success",
        assets,
        files,
        thumbnails,
        savedPaths,
        durationMs: Date.now() - startTime,
        rawResponse,
      };
    } catch (error) {
      return {
        status: "failed",
        assets: [],
        files: [],
        thumbnails: [],
        savedPaths: [],
        durationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static async callOpenAISync(
    channel: Channel,
    task: TaskDefinition,
    mappedInput: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<unknown> {
    const response = await HttpClient.request({
      url: `${channel.baseUrl}${task.endpoint}`,
      method: task.method,
      headers,
      body: JSON.stringify(mappedInput),
      timeout: channel.requestConfig.timeout || 60000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private static async callMultipartSync(
    channel: Channel,
    task: TaskDefinition,
    mappedInput: Record<string, unknown>,
    inputImages: ImageSource[],
    headers: Record<string, string>
  ): Promise<unknown> {
    const formData = await this.buildFormData(mappedInput, inputImages);

    const response = await HttpClient.request({
      url: `${channel.baseUrl}${task.endpoint}`,
      method: task.method,
      headers,
      body: formData,
      timeout: channel.requestConfig.timeout || 60000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private static async callAsyncPoll(
    channel: Channel,
    task: TaskDefinition,
    mappedInput: Record<string, unknown>,
    inputImages: ImageSource[],
    headers: Record<string, string>,
    apiKey: string | undefined
  ): Promise<unknown> {
    let requestBody: string | FormData;
    if (task.requestType === "multipart") {
      requestBody = await this.buildFormData(mappedInput, inputImages);
    } else {
      requestBody = JSON.stringify(mappedInput);
    }

    const submitResponse = await HttpClient.request({
      url: `${channel.baseUrl}${task.endpoint}`,
      method: task.method,
      headers,
      body: requestBody,
      timeout: channel.requestConfig.timeout || 60000,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Submit failed: ${submitResponse.status} - ${errorText}`);
    }

    const initialData = await submitResponse.json();
    const taskId = ResponseNormalizer.inferTaskId(initialData, task.taskIdPath || "task_id");
    if (!taskId) throw new Error("Failed to get task ID from async response");

    const pollUrl = `${channel.baseUrl}${(task.pollEndpoint || "/task/{task_id}").replace("{task_id}", taskId)}`;
    const pollHeaders = this.buildHeaders(channel, apiKey, "json");

    return await TaskPoller.poll({
      taskId,
      pollUrl,
      interval: task.pollInterval || 10000,
      maxDuration: task.maxPollDuration || 30 * 60 * 1000,
      headers: pollHeaders,
      statusField: task.taskStatusPath || "status",
      successStatus: task.taskSuccessStatus || "success",
      failedStatus: task.taskFailedStatuses || ["failed", "cancelled", "rejected"],
    });
  }

  private static buildHeaders(
    channel: Channel,
    apiKey: string | undefined,
    requestType: string
  ): Record<string, string> {
    const headers: Record<string, string> = { ...channel.requestConfig.headers };
    if (requestType !== "multipart") {
      headers["Content-Type"] = "application/json";
    }
    if (apiKey) {
      if (channel.auth.type === "bearer") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else if (channel.auth.type === "api-key") {
        headers[channel.auth.headerKey || "X-API-Key"] = apiKey;
      }
    }
    return headers;
  }

  private static async buildFormData(
    mappedInput: Record<string, unknown>,
    inputImages: ImageSource[]
  ): Promise<FormData> {
    const formData = new FormData();

    for (const [key, value] of Object.entries(mappedInput)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "object" && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }

    for (const image of inputImages) {
      try {
        const blob = await this.imageSourceToBlob(image);
        formData.append(image.role || "image", blob, image.name || "image.png");
      } catch (error) {
        console.error("Failed to process image:", error);
      }
    }

    return formData;
  }

  private static async imageSourceToBlob(image: ImageSource): Promise<Blob> {
    if (image.data.startsWith("http")) {
      return await HttpClient.downloadUrl(image.data);
    }
    const base64Data = image.data.split(",")[1] || image.data;
    const mimeType = image.data.match(/^data:([^;]+);/)?.[1] || "image/png";
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  private static async saveAssets(
    assets: NormalizedAsset[],
    input: ExecutionInput,
    outputConfig: OutputConfig
  ): Promise<{ files: string[]; thumbnails: string[]; savedPaths: string[] }> {
    const files: string[] = [];
    const thumbnails: string[] = [];
    const savedPaths: string[] = [];

    for (const asset of assets) {
      try {
        let blob: Blob | undefined;
        let filename: string;

        if (asset.type === "json") {
          const jsonStr = JSON.stringify(asset.raw, null, 2);
          blob = new Blob([jsonStr], { type: "application/json" });
          filename = FileSaver.generateFilename(input, outputConfig, input.model).replace(/\.\w+$/, ".json");
        } else if (asset.b64) {
          let b64 = asset.b64;
          if (b64.startsWith("data:")) b64 = b64.split(",")[1];
          filename = FileSaver.generateFilename(input, outputConfig, input.model);
          blob = FileSaver.b64ToBlob(b64, asset.mimeType || "image/png");
        } else if (asset.url) {
          blob = await HttpClient.downloadUrl(asset.url);
          filename = FileSaver.generateFilename(input, outputConfig, input.model);
        } else if (asset.blob) {
          blob = asset.blob;
          filename = FileSaver.generateFilename(input, outputConfig, input.model);
        } else {
          continue;
        }

        const blobResult = await FileSaver.saveFromBlob(blob, filename);
        asset.url = blobResult.url;
        files.push(blobResult.url);

        try {
          const serverResult = await FileSaver.saveToServer(blob, filename);
          savedPaths.push(serverResult.path);
        } catch (e) {
          console.error("Failed to save to server:", e);
        }

        if (asset.type !== "json") {
          try {
            const thumbnail = await ThumbnailGenerator.generateFromBlob(blob);
            thumbnails.push(thumbnail);
          } catch {
            // thumbnail generation failed — skip
          }
        }
      } catch (error) {
        console.error("Failed to save asset:", error);
      }
    }

    return { files, thumbnails, savedPaths };
  }
}

export default ChannelRunner;
