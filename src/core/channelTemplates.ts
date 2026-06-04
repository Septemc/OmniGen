import type { Channel, TaskDefinition, ParamField, InputMapping, OutputMapping, ModelOption } from "./types";

const MOARK_BASE = "https://ai.gitee.com/v1";

// ========== 工厂函数 ==========
export function createEmptyChannel(): Channel {
  return {
    id: crypto.randomUUID(),
    name: "",
    provider: "",
    version: "1.0.0",
    enabled: true,
    baseUrl: "",
    auth: { type: "bearer" },
    requestConfig: { timeout: 60000 },
    tasks: [],
    inputMapping: [],
    outputMapping: [],
  };
}

export function createEmptyTask(type?: string): TaskDefinition {
  return {
    type: (type as any) || "text_to_image",
    label: "",
    endpoint: "",
    method: "POST",
    requestType: "json",
    callMode: "openai_sync",
    responseMode: "openai_images",
    async: false,
    outputKind: "base64_or_url",
    models: [],
    paramSchema: [],
  };
}

export function createEmptyParamField(): ParamField {
  return { key: "", label: "", type: "string", apiField: "", required: false };
}

export function createEmptyModel(): ModelOption {
  return { id: "", name: "" };
}

export function createEmptyInputMapping(): InputMapping {
  return { uiField: "", apiField: "" };
}

export function createEmptyOutputMapping(): OutputMapping {
  return { kind: "url", dataPath: "" };
}

// ========== 枚举选项 ==========
export const TASK_TYPE_OPTIONS = [
  { label: "文生图", value: "text_to_image" },
  { label: "图像编辑", value: "image_edit" },
  { label: "抠图", value: "matting" },
  { label: "超分辨率", value: "upscaling" },
  { label: "目标检测", value: "object_detection" },
  { label: "文档矫正", value: "document_unwarping" },
  { label: "图像分层", value: "image_layering" },
];

export const AUTH_TYPE_OPTIONS = [
  { label: "Bearer Token", value: "bearer" },
  { label: "API Key (Header)", value: "api-key" },
  { label: "自定义 Header", value: "header" },
];

export const REQUEST_TYPE_OPTIONS = [
  { label: "JSON", value: "json" },
  { label: "Multipart Form", value: "multipart" },
  { label: "URL-encoded Form", value: "form" },
];

export const CALL_MODE_OPTIONS = [
  { label: "OpenAI 同步", value: "openai_sync" },
  { label: "Multipart 同步", value: "multipart_sync" },
  { label: "异步轮询", value: "async_poll" },
];

export const RESPONSE_MODE_OPTIONS = [
  { label: "OpenAI Images (data[].url/b64)", value: "openai_images" },
  { label: "Multipart Data (output.data[])", value: "multipart_data" },
  { label: "异步文件 URL (output.file_url)", value: "async_file_url" },
  { label: "异步文本结果 (output.text_result)", value: "async_text_result" },
  { label: "原始 JSON", value: "raw_json" },
];

export const OUTPUT_KIND_OPTIONS = [
  { label: "Base64", value: "base64" },
  { label: "URL", value: "url" },
  { label: "Base64 或 URL", value: "base64_or_url" },
];

export const PARAM_TYPE_OPTIONS = [
  { label: "文本", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔", value: "boolean" },
  { label: "下拉选择", value: "select" },
  { label: "滑块", value: "slider" },
  { label: "多行文本", value: "textarea" },
  { label: "图片上传", value: "image" },
  { label: "标签", value: "tags" },
  { label: "JSON", value: "json" },
];

export const OUTPUT_MAPPING_KIND_OPTIONS = [
  { label: "Base64", value: "base64" },
  { label: "URL", value: "url" },
  { label: "文件 URL", value: "file_url" },
  { label: "嵌套 URL", value: "nested_url" },
];

// ========== 通用参数 Schema 片段 ==========
const SIZE_OPTIONS = [
  { label: "1024×1024", value: "1024x1024" },
  { label: "768×1024", value: "768x1024" },
  { label: "1024×768", value: "1024x768" },
  { label: "1024×1536", value: "1024x1536" },
  { label: "1536×1024", value: "1536x1024" },
  { label: "2048×2048", value: "2048x2048" },
];

// ========== Gitee AI (Moark) 完整渠道配置 ==========
const giteeAITextToImageModels: ModelOption[] = [
  { id: "flux-1-schnell", name: "FLUX.1-schnell" },
  { id: "FLUX.1-dev", name: "FLUX.1-dev" },
  { id: "FLUX.2-dev", name: "FLUX.2-dev" },
  { id: "FLUX.2-klein-9B", name: "FLUX.2-klein-9B" },
  { id: "FLUX.2-klein-4B", name: "FLUX.2-klein-4B" },
  { id: "Kolors", name: "Kolors" },
  { id: "Qwen-Image", name: "Qwen-Image" },
  { id: "Qwen-Image-2512", name: "Qwen-Image-2512" },
  { id: "GLM-Image", name: "GLM-Image" },
  { id: "Z-Image", name: "Z-Image" },
  { id: "z-image-turbo", name: "Z-Image Turbo" },
  { id: "LongCat-Image", name: "LongCat-Image" },
  { id: "stable-diffusion-3.5-large-turbo", name: "SD 3.5 Turbo" },
  { id: "CogView4_6B", name: "CogView4_6B" },
  { id: "HiDream-I1-Full", name: "HiDream-I1-Full" },
];

const giteeAIEditModels: ModelOption[] = [
  { id: "FLUX.1-Kontext-dev", name: "FLUX.1-Kontext-dev" },
  { id: "LongCat-Image-Edit", name: "LongCat-Image-Edit" },
  { id: "Qwen-Image-Edit-2511", name: "Qwen-Image-Edit-2511" },
  { id: "DreamO", name: "DreamO" },
  { id: "InstantCharacter", name: "InstantCharacter" },
  { id: "HiDream-E1-Full", name: "HiDream-E1-Full" },
];

const giteeAIMattingModels: ModelOption[] = [
  { id: "RMBG-2.0", name: "RMBG-2.0" },
];

const giteeAIUpscaleModels: ModelOption[] = [
  { id: "Real-ESRGAN", name: "Real-ESRGAN" },
  { id: "AnimeSharp", name: "AnimeSharp" },
  { id: "SeedVR2-3B", name: "SeedVR2-3B" },
];

const giteeAIDetectionModels: ModelOption[] = [
  { id: "Florence-2-large", name: "Florence-2-large" },
  { id: "sam3", name: "sam3" },
  { id: "VajraV1", name: "VajraV1" },
];

const giteeAIUnwarpingModels: ModelOption[] = [
  { id: "UVDoc", name: "UVDoc" },
];

const giteeAILayerModels: ModelOption[] = [
  { id: "Qwen-Image-Layered", name: "Qwen-Image-Layered" },
];

// ========== 通用输入映射 ==========
const textToImageInputMapping: InputMapping[] = [
  { uiField: "prompt", apiField: "prompt" },
  { uiField: "model", apiField: "model" },
  { uiField: "size", apiField: "size" },
  { uiField: "steps", apiField: "num_inference_steps" },
  { uiField: "guidance", apiField: "guidance_scale" },
  { uiField: "seed", apiField: "seed" },
  { uiField: "negativePrompt", apiField: "negative_prompt" },
];

const editInputMapping: InputMapping[] = [
  { uiField: "prompt", apiField: "prompt" },
  { uiField: "model", apiField: "model" },
  { uiField: "size", apiField: "size" },
  { uiField: "steps", apiField: "num_inference_steps" },
  { uiField: "guidance", apiField: "guidance_scale" },
  { uiField: "seed", apiField: "seed" },
  { uiField: "taskTypes", apiField: "task_types" },
  { uiField: "loraWeights", apiField: "lora_weights" },
];

// ========== 通用输出映射 ==========
const openAIOutputMapping: OutputMapping[] = [
  { kind: "base64", dataPath: "data[0].b64_json", mimeType: "image/png" },
  { kind: "url", dataPath: "data[0].url", mimeType: "image/png" },
];

const asyncOutputMapping: OutputMapping[] = [
  { kind: "nested_url", dataPath: "output.file_url", mimeType: "image/png" },
];

const multipartOutputMapping: OutputMapping[] = [
  { kind: "url", dataPath: "data[0].url", mimeType: "image/png" },
  { kind: "base64", dataPath: "data[0].b64_json", mimeType: "image/png" },
];

// ========== 默认渠道模板 ==========
export const DEFAULT_CHANNEL_TEMPLATES: Channel[] = [
  {
    id: "gitee-ai",
    name: "Gitee AI (Moark)",
    provider: "Gitee",
    version: "2.0.0",
    enabled: true,
    baseUrl: MOARK_BASE,
    auth: { type: "bearer", keyName: "apiKey" },
    requestConfig: { timeout: 120000 },
    tasks: [
      // ===== 文生图 (OpenAI 同步) =====
      {
        type: "text_to_image",
        label: "文生图",
        endpoint: "/images/generations",
        method: "POST",
        requestType: "json",
        callMode: "openai_sync",
        responseMode: "openai_images",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAITextToImageModels,
        paramSchema: [
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "size", label: "尺寸", type: "select", apiField: "size", default: "1024x1024", options: SIZE_OPTIONS },
          { key: "numImages", label: "生成数量", type: "number", apiField: "num_images_per_prompt", default: 1, min: 1, max: 4, advanced: true },
          { key: "steps", label: "推理步数", type: "slider", apiField: "num_inference_steps", min: 1, max: 50, step: 1, default: 28 },
          { key: "guidance", label: "引导强度", type: "slider", apiField: "guidance_scale", min: 0, max: 20, step: 0.1, default: 7.5 },
          { key: "seed", label: "随机种子", type: "number", apiField: "seed", default: 0, advanced: true },
        ],
      },
      // ===== 图像编辑 (Multipart 同步) =====
      {
        type: "image_edit",
        label: "图像编辑",
        endpoint: "/images/edits",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "openai_images",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAIEditModels.filter((m) => m.id !== "Qwen-Image-Edit-2511"),
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 4, imageRoles: ["image", "style", "id", "control"] },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "size", label: "输出尺寸", type: "select", apiField: "size", default: "1024x1024", options: SIZE_OPTIONS },
          { key: "steps", label: "推理步数", type: "slider", apiField: "num_inference_steps", min: 1, max: 50, step: 1, default: 28 },
          { key: "guidance", label: "引导强度", type: "slider", apiField: "guidance_scale", min: 0, max: 20, step: 0.1, default: 7.5 },
          { key: "taskTypes", label: "参考图角色", type: "tags", apiField: "task_types", default: [], description: "标记各图片角色，可选值: ip / style / id" },
          { key: "loraWeights", label: "LoRA 权重", type: "json", apiField: "lora_weights", default: [], advanced: true, conditions: [{ when: "model", in: ["DreamO", "InstantCharacter"] }] },
        ],
      },
      // ===== 异步图像编辑 =====
      {
        type: "image_edit",
        subType: "async",
        label: "图像编辑（异步）",
        endpoint: "/async/images/edits",
        method: "POST",
        requestType: "multipart",
        callMode: "async_poll",
        responseMode: "async_file_url",
        async: true,
        outputKind: "url",
        pollEndpoint: "/task/{task_id}",
        taskIdPath: "task_id",
        taskStatusPath: "status",
        taskSuccessStatus: "success",
        taskFailedStatuses: ["failed", "cancelled"],
        pollInterval: 10000,
        maxPollDuration: 1800000,
        models: [{ id: "Qwen-Image-Edit-2511", name: "Qwen-Image-Edit-2511" }],
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 4, imageRoles: ["image", "style", "id", "control"] },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "size", label: "输出尺寸", type: "select", apiField: "size", default: "1024x1024", options: SIZE_OPTIONS },
          { key: "steps", label: "推理步数", type: "slider", apiField: "num_inference_steps", min: 1, max: 50, step: 1, default: 28 },
        ],
      },
      // ===== 抠图 =====
      {
        type: "matting",
        label: "背景移除",
        endpoint: "/images/mattings",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "multipart_data",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAIMattingModels,
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 1 },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
        ],
      },
      // ===== 超分辨率 =====
      {
        type: "upscaling",
        label: "超分辨率",
        endpoint: "/images/upscaling",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "multipart_data",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAIUpscaleModels,
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 1 },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "outscale", label: "放大倍数", type: "slider", apiField: "outscale", min: 2, max: 8, step: 1, default: 4 },
          { key: "faceEnhance", label: "人脸增强", type: "boolean", apiField: "face_enhance", default: false, conditions: [{ when: "model", equals: "Real-ESRGAN" }] },
        ],
      },
      // ===== 目标检测 =====
      {
        type: "object_detection",
        label: "目标检测/分割",
        endpoint: "/images/detections",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "raw_json",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAIDetectionModels,
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 1 },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "prompt", label: "检测提示", type: "textarea", apiField: "prompt", placeholder: "可选：指定要检测的对象", conditions: [{ when: "model", in: ["Florence-2-large", "VajraV1"] }] },
        ],
      },
      // ===== 文档矫正 =====
      {
        type: "document_unwarping",
        label: "文档矫正",
        endpoint: "/images/unwarping",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "multipart_data",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAIUnwarpingModels,
        paramSchema: [
          { key: "image", label: "文档图片", type: "image", apiField: "image", required: true, maxCount: 1 },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
        ],
      },
      // ===== 图像分层 =====
      {
        type: "image_layering",
        label: "图像分层",
        endpoint: "/images/layers",
        method: "POST",
        requestType: "multipart",
        callMode: "multipart_sync",
        responseMode: "multipart_data",
        async: false,
        outputKind: "base64_or_url",
        models: giteeAILayerModels,
        paramSchema: [
          { key: "image", label: "原图", type: "image", apiField: "image", required: true, maxCount: 1 },
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
        ],
      },
    ],
    inputMapping: [
      ...textToImageInputMapping,
      ...editInputMapping.filter((m) => !textToImageInputMapping.find((t) => t.uiField === m.uiField)),
      { uiField: "outscale", apiField: "outscale" },
      { uiField: "faceEnhance", apiField: "face_enhance" },
    ],
    outputMapping: [
      ...openAIOutputMapping,
      ...asyncOutputMapping,
      ...multipartOutputMapping,
    ],
  },
  // ===== OpenAI DALL·E =====
  {
    id: "openai",
    name: "OpenAI DALL·E",
    provider: "OpenAI",
    version: "2.0.0",
    enabled: true,
    baseUrl: "https://api.openai.com/v1",
    auth: { type: "bearer", keyName: "apiKey" },
    requestConfig: { timeout: 60000 },
    tasks: [
      {
        type: "text_to_image",
        label: "文生图",
        endpoint: "/images/generations",
        method: "POST",
        requestType: "json",
        callMode: "openai_sync",
        responseMode: "openai_images",
        async: false,
        outputKind: "url",
        models: [
          { id: "dall-e-3", name: "DALL·E 3" },
          { id: "dall-e-2", name: "DALL·E 2" },
        ],
        paramSchema: [
          { key: "model", label: "模型", type: "select", apiField: "model", required: true, optionsFrom: "@tasks[0]" },
          { key: "size", label: "尺寸", type: "select", apiField: "size", default: "1024x1024", options: [{ label: "1024×1024", value: "1024x1024" }, { label: "1792×1024", value: "1792x1024" }, { label: "1024×1792", value: "1024x1792" }] },
          { key: "quality", label: "质量", type: "select", apiField: "quality", default: "standard", options: [{ label: "Standard", value: "standard" }, { label: "HD", value: "hd" }], conditions: [{ when: "model", equals: "dall-e-3" }] },
          { key: "style", label: "风格", type: "select", apiField: "style", default: "vivid", options: [{ label: "Vivid", value: "vivid" }, { label: "Natural", value: "natural" }], conditions: [{ when: "model", equals: "dall-e-3" }] },
        ],
      },
    ],
    inputMapping: [
      { uiField: "prompt", apiField: "prompt" },
      { uiField: "model", apiField: "model" },
      { uiField: "size", apiField: "size" },
      { uiField: "quality", apiField: "quality" },
      { uiField: "style", apiField: "style" },
    ],
    outputMapping: [
      { kind: "url", dataPath: "data[0].url" },
      { kind: "base64", dataPath: "data[0].b64_json" },
    ],
  },
];
