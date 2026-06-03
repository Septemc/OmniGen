import type { ResponseMode, NormalizedAsset } from "./types";

export class ResponseNormalizer {
  static normalize(rawResponse: unknown, responseMode: ResponseMode): NormalizedAsset[] {
    switch (responseMode) {
      case "openai_images":
        return this.normalizeOpenAIImages(rawResponse);
      case "multipart_data":
        return this.normalizeMultipartData(rawResponse);
      case "async_file_url":
        return this.normalizeAsyncFileUrl(rawResponse);
      case "async_text_result":
        return this.normalizeAsyncTextResult(rawResponse);
      case "raw_json":
        return this.normalizeRawJson(rawResponse);
      default:
        return this.normalizeAuto(rawResponse);
    }
  }

  // OpenAI 同步模式: response.data[].url / data[].b64_json
  private static normalizeOpenAIImages(raw: unknown): NormalizedAsset[] {
    const resp = raw as any;
    const assets: NormalizedAsset[] = [];
    const dataList = resp?.data;
    if (!Array.isArray(dataList)) return assets;

    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      if (item.url) {
        assets.push({
          id: `asset-${i}`,
          type: "image",
          url: item.url,
          mimeType: this.inferMimeTypeFromUrl(item.url),
        });
      }
      if (item.b64_json) {
        assets.push({
          id: `asset-b64-${i}`,
          type: "image",
          b64: item.b64_json,
          mimeType: "image/png",
        });
      }
    }
    return assets;
  }

  // Multipart 同步模式: output.data[].url / data[].b64_json
  private static normalizeMultipartData(raw: unknown): NormalizedAsset[] {
    const resp = raw as any;
    const assets: NormalizedAsset[] = [];

    const dataList = resp?.data || resp?.output?.data;
    if (Array.isArray(dataList)) {
      for (let i = 0; i < dataList.length; i++) {
        const item = dataList[i];
        if (item.url) {
          assets.push({
            id: `asset-${i}`,
            type: "image",
            url: item.url,
            mimeType: this.inferMimeTypeFromUrl(item.url),
          });
        }
        if (item.b64_json) {
          assets.push({
            id: `asset-b64-${i}`,
            type: "image",
            b64: item.b64_json,
            mimeType: "image/png",
          });
        }
      }
    }

    if (resp?.output?.mask || resp?.output?.mask_url) {
      assets.push({
        id: "asset-mask",
        type: "mask",
        url: resp.output.mask_url,
        b64: resp.output.mask,
        mimeType: "image/png",
      });
    }

    return assets;
  }

  // 异步模式: output.file_url
  private static normalizeAsyncFileUrl(raw: unknown): NormalizedAsset[] {
    const resp = raw as any;
    const assets: NormalizedAsset[] = [];

    const fileUrl = resp?.output?.file_url;
    if (fileUrl) {
      assets.push({
        id: "asset-file",
        type: "image",
        url: fileUrl,
        mimeType: this.inferMimeTypeFromUrl(fileUrl),
      });
    }

    const fileUrls = resp?.output?.file_urls;
    if (Array.isArray(fileUrls)) {
      for (let i = 0; i < fileUrls.length; i++) {
        assets.push({
          id: `asset-file-${i}`,
          type: "image",
          url: fileUrls[i],
          mimeType: this.inferMimeTypeFromUrl(fileUrls[i]),
        });
      }
    }

    return assets;
  }

  // 异步模式: output.text_result (检测/分割等)
  private static normalizeAsyncTextResult(raw: unknown): NormalizedAsset[] {
    const resp = raw as any;
    const assets: NormalizedAsset[] = [];

    const textResult = resp?.output?.text_result;
    if (textResult) {
      let parsed: any = textResult;
      if (typeof textResult === "string") {
        try { parsed = JSON.parse(textResult); } catch { parsed = textResult; }
      }
      assets.push({
        id: "asset-text",
        type: "json",
        raw: parsed,
        label: "检测结果",
      });
    }

    return assets;
  }

  // 原始 JSON 模式
  private static normalizeRawJson(raw: unknown): NormalizedAsset[] {
    return [{
      id: "asset-raw",
      type: "json",
      raw,
      label: "原始响应",
    }];
  }

  // 自动检测模式
  private static normalizeAuto(raw: unknown): NormalizedAsset[] {
    const resp = raw as any;

    if (Array.isArray(resp?.data) && resp.data.length > 0) {
      if (resp.data[0].url || resp.data[0].b64_json) {
        return this.normalizeOpenAIImages(raw);
      }
    }

    if (resp?.output?.file_url) {
      return this.normalizeAsyncFileUrl(raw);
    }

    if (resp?.output?.text_result) {
      return this.normalizeAsyncTextResult(raw);
    }

    if (resp?.output?.data || (Array.isArray(resp?.data) && resp.data[0]?.url)) {
      return this.normalizeMultipartData(raw);
    }

    return this.normalizeRawJson(raw);
  }

  static inferTaskId(raw: unknown, taskIdPath?: string): string | undefined {
    if (!taskIdPath) return undefined;
    return String(this.getNestedValue(raw, taskIdPath));
  }

  static inferTaskStatus(raw: unknown, statusPath?: string): string | undefined {
    const path = statusPath || "status";
    const value = this.getNestedValue(raw, path);
    return value ? String(value).toLowerCase() : undefined;
  }

  private static getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== "object") return undefined;
    const keys = path.split(".");
    let current: any = obj;
    for (const key of keys) {
      const arrMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrMatch) {
        current = current?.[arrMatch[1]]?.[parseInt(arrMatch[2], 10)];
      } else {
        current = current?.[key];
      }
      if (current === undefined) return undefined;
    }
    return current;
  }

  private static inferMimeTypeFromUrl(url: string): string {
    if (!url) return "image/png";
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    };
    return mimeMap[ext || ""] || "image/png";
  }
}

export default ResponseNormalizer;
