import { defineStore } from "pinia";
import { ref } from "vue";
import * as repo from "@/db/repo";
import ChannelRunner from "@/core/ChannelRunner";
import { useChannelStore } from "./channelStore";
import type {
  ExecutionInput,
  OutputConfig,
  ImageSource,
  RunHistory,
  NormalizedAsset,
} from "@/core/types";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useStudioStore = defineStore("studio", () => {
  const prompt = ref("");
  const negativePrompt = ref("");
  const params = ref<Record<string, unknown>>({});
  const inputImages = ref<ImageSource[]>([]);
  const status = ref<"idle" | "running" | "success" | "failed">("idle");
  const resultUrls = ref<string[]>([]);
  const resultAssets = ref<NormalizedAsset[]>([]);
  const errorMessage = ref("");
  const durationMs = ref<number | undefined>(undefined);
  const currentRunId = ref<string | undefined>(undefined);

  const outputConfig = ref<OutputConfig>({
    outputDir: "",
    namingTemplate: "{date}_{time}_{channel}_{model}_{prompt20}",
    timestampFormat: "YYYYMMDD_HHmmss",
    promptSubstrLen: 20,
    overwrite: "rename",
  });

  async function execute(): Promise<void> {
    const channelStore = useChannelStore();
    const currentChannel = channelStore.currentChannel;
    const currentTask = channelStore.currentTask;

    if (!currentChannel || !currentTask) {
      errorMessage.value = "请先选择渠道和任务";
      status.value = "failed";
      return;
    }

    const modelId = String(params.value.model || "");

    try {
      status.value = "running";
      errorMessage.value = "";
      currentRunId.value = crypto.randomUUID();

      const input: ExecutionInput = {
        channelId: channelStore.currentChannelId,
        taskType: channelStore.currentTaskType,
        prompt: prompt.value,
        negativePrompt: negativePrompt.value || undefined,
        model: modelId || undefined,
        params: params.value,
        inputImages: inputImages.value,
      };

      const channelCredentials = await repo.getAllChannelApiKeys();
      const apiKey = channelCredentials.get(input.channelId);
      if (!apiKey) {
        throw new Error(`请先在渠道管理页面为「${currentChannel?.name || input.channelId}」配置 API Key`);
      }

      const result = await ChannelRunner.execute(
        input,
        outputConfig.value,
        channelCredentials
      );

      resultUrls.value = result.files;
      resultAssets.value = result.assets;
      durationMs.value = result.durationMs;
      status.value = result.status === "success" ? "success" : "failed";

      if (result.status === "failed" && result.errorMessage) {
        errorMessage.value = result.errorMessage;
      }

      const history: RunHistory = {
        id: currentRunId.value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        channelId: input.channelId,
        channelName: currentChannel.name,
        taskType: input.taskType,
        modelId: modelId || undefined,
        modelName:
          currentTask.models?.find((m) => m.id === modelId)?.name || modelId,
        prompt: prompt.value,
        params: JSON.parse(JSON.stringify(params.value)),
        status: result.status,
        files: result.files,
        thumbnails: result.thumbnails,
        savedPaths: result.savedPaths,
        durationMs: result.durationMs,
        errorMessage: result.errorMessage,
      };

      await repo.saveHistory(history);
    } catch (error) {
      status.value = "failed";
      errorMessage.value =
        error instanceof Error ? error.message : String(error);
    }
  }

  function reset(): void {
    status.value = "idle";
    resultUrls.value = [];
    resultAssets.value = [];
    errorMessage.value = "";
    durationMs.value = undefined;
    currentRunId.value = undefined;
  }

  function buildCurrentModelKey(): string | null {
    const channelStore = useChannelStore();
    const channelId = channelStore.currentChannelId;
    const taskType = channelStore.currentTaskType;
    const subType = channelStore.currentTaskSubType || "";
    const modelId = String(params.value.model || "");
    if (!channelId || !modelId) return null;
    return repo.buildModelParamsKey(channelId, taskType, subType, modelId);
  }

  async function loadModelParams(): Promise<boolean> {
    const key = buildCurrentModelKey();
    if (!key) return false;
    const saved = await repo.getSettings(key) as repo.SavedModelParams | undefined;
    if (!saved) return false;
    if (saved.params) {
      const currentModel = params.value.model;
      setParams({ ...saved.params, model: currentModel });
    }
    if (saved.prompt !== undefined) prompt.value = saved.prompt;
    if (saved.negativePrompt !== undefined) negativePrompt.value = saved.negativePrompt;
    return true;
  }

  async function saveModelParamsNow(): Promise<void> {
    const key = buildCurrentModelKey();
    if (!key) return;
    const data: repo.SavedModelParams = {
      params: JSON.parse(JSON.stringify(params.value)),
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
    };
    try {
      await repo.saveSettings(key, data);
    } catch (e) {
      console.error("Failed to save model params:", e);
    }
  }

  function scheduleModelParamsSave(): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveModelParamsNow();
    }, 500);
  }

  function setParam(key: string, value: unknown): void {
    params.value = { ...params.value, [key]: value };
    scheduleModelParamsSave();
  }

  function setParams(newParams: Record<string, unknown>): void {
    params.value = { ...newParams };
    scheduleModelParamsSave();
  }

  function addInputImage(image: ImageSource): void {
    inputImages.value.push(image);
  }

  function removeInputImage(id: string): void {
    inputImages.value = inputImages.value.filter((img) => img.id !== id);
  }

  function clearInputImages(): void {
    inputImages.value = [];
  }

  function reuseHistory(history: RunHistory): void {
    prompt.value = history.prompt;
    params.value = { ...history.params };
    status.value = history.status as any;
    resultUrls.value = [...history.files];
  }

  return {
    prompt,
    negativePrompt,
    params,
    inputImages,
    status,
    resultUrls,
    resultAssets,
    errorMessage,
    durationMs,
    currentRunId,
    outputConfig,
    execute,
    reset,
    setParam,
    setParams,
    addInputImage,
    removeInputImage,
    clearInputImages,
    reuseHistory,
    loadModelParams,
    saveModelParamsNow,
    scheduleModelParamsSave,
    buildCurrentModelKey,
  };
});
