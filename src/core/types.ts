// ========== 任务类型 ==========
export type TaskType =
  | "text_to_image"
  | "image_edit"
  | "matting"
  | "upscaling"
  | "object_detection"
  | "document_unwarping"
  | "image_layering";

// ========== 认证类型 ==========
export type AuthType = "bearer" | "api-key" | "header";

// ========== 请求格式 ==========
export type RequestType = "json" | "multipart" | "form";

// ========== 调用模式 ==========
export type CallMode = "openai_sync" | "multipart_sync" | "async_poll";

// ========== 响应模式 ==========
export type ResponseMode =
  | "openai_images"       // response.data[].url / data[].b64_json
  | "multipart_data"      // output.data[].url / data[].b64_json
  | "async_file_url"      // output.file_url
  | "async_text_result"   // output.text_result
  | "raw_json";           // 直接返回 JSON 对象

// ========== 输出类型 ==========
export type OutputKind = "base64" | "url" | "base64_or_url";

// ========== 参数字段类型 ==========
export type ParamFieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "slider"
  | "textarea"
  | "image"
  | "tags"
  | "json";

// ========== 资产类型 ==========
export type AssetType = "image" | "mask" | "layer" | "box" | "json";

// ========== 模型选项 ==========
export interface ModelOption {
  id: string;
  name: string;
}

// ========== 条件字段 ==========
export interface ParamCondition {
  when: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  greaterThan?: number;
  lessThan?: number;
}

// ========== 参数字段 Schema ==========
export interface ParamField {
  key: string;
  label: string;
  type: ParamFieldType;
  apiField: string;
  default?: unknown;
  options?: Array<{ label: string; value: unknown }>;
  optionsFrom?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  description?: string;
  advanced?: boolean;
  placeholder?: string;
  maxCount?: number;
  imageRoles?: string[];
  conditions?: ParamCondition[];
}

// ========== 任务定义 ==========
export interface TaskDefinition {
  type: TaskType;
  subType?: string;  // 同一个 type 下有多个任务定义时用于区分，如 "sync" | "async"
  label: string;
  endpoint: string;
  method: "POST" | "GET";
  requestType: RequestType;
  callMode: CallMode;
  responseMode: ResponseMode;
  async: boolean;
  outputKind: OutputKind;

  pollEndpoint?: string;
  pollInterval?: number;
  maxPollDuration?: number;
  taskIdPath?: string;
  taskStatusPath?: string;
  taskSuccessStatus?: string;
  taskFailedStatuses?: string[];

  models?: ModelOption[];
  paramSchema: ParamField[];
}

// ========== 输入映射 ==========
export interface InputMapping {
  uiField: string;
  apiField: string;
  enumMap?: Record<string, string>;
  default?: unknown;
}

// ========== 输出映射 ==========
export interface OutputMapping {
  kind: "base64" | "url" | "file_url" | "nested_url";
  dataPath: string;
  mimeType?: string;
  extension?: string;
}

// ========== 渠道认证配置 ==========
export interface ChannelAuth {
  type: AuthType;
  keyName?: string;
  headerKey?: string;
  keyEnvVar?: string;
}

// ========== 请求配置 ==========
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

// ========== 完整渠道配置 ==========
export interface Channel {
  id: string;
  name: string;
  provider: string;
  version: string;
  enabled: boolean;
  baseUrl: string;
  auth: ChannelAuth;
  requestConfig: RequestConfig;
  tasks: TaskDefinition[];
  inputMapping: InputMapping[];
  outputMapping: OutputMapping[];
}

// ========== 图片输入源 ==========
export interface ImageSource {
  id: string;
  data: string;
  role: string;
  name?: string;
}

// ========== 执行输入 ==========
export interface ExecutionInput {
  channelId: string;
  taskType: TaskType;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  params: Record<string, unknown>;
  inputImages: ImageSource[];
}

// ========== 输出配置 ==========
export interface OutputConfig {
  outputDir: string;
  namingTemplate: string;
  timestampFormat: string;
  promptSubstrLen: number;
  overwrite: "error" | "rename" | "overwrite";
}

// ========== 归一化资产 ==========
export interface NormalizedAsset {
  id: string;
  type: AssetType;
  url?: string;
  b64?: string;
  blob?: Blob;
  width?: number;
  height?: number;
  mimeType?: string;
  label?: string;
  raw?: unknown;
}

// ========== 执行结果 ==========
export interface ExecutionResult {
  status: "success" | "failed" | "timeout";
  assets: NormalizedAsset[];
  files: string[];
  thumbnails: string[];
  savedPaths: string[];
  durationMs?: number;
  errorMessage?: string;
  rawResponse?: unknown;
  taskId?: string;
}

// ========== 运行历史记录 ==========
export interface RunHistory {
  id: string;
  createdAt: number;
  updatedAt: number;
  channelId: string;
  channelName: string;
  taskType: TaskType;
  modelId?: string;
  modelName?: string;
  prompt: string;
  params: Record<string, unknown>;
  status: "success" | "failed" | "timeout";
  files: string[];
  thumbnails: string[];
  savedPaths: string[];
  durationMs?: number;
  errorMessage?: string;
}

// ========== 应用设置 ==========
export interface AppSettings {
  defaultChannelId?: string;
  outputConfig: OutputConfig;
  saveDirectoryName?: string;
}
