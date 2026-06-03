import { db } from "./dexie";
import type { RunHistory, Channel } from "../core/types";

// ========== 历史记录 ==========
export async function saveHistory(record: RunHistory): Promise<void> {
  const plain = JSON.parse(JSON.stringify(record));
  await db.history.put(plain);
}

export async function getAllHistory(): Promise<RunHistory[]> {
  return db.history.orderBy("createdAt").reverse().toArray();
}

export async function deleteHistory(id: string): Promise<void> {
  await db.history.delete(id);
}

// ========== 应用设置 ==========
export async function saveSettings(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getSettings(key: string, defaultValue?: any): Promise<any> {
  const record = await db.settings.get(key);
  return record?.value ?? defaultValue;
}

export async function deleteSettings(key: string): Promise<void> {
  await db.settings.delete(key);
}

// ========== 模型参数记忆 ==========
export interface SavedModelParams {
  params: Record<string, unknown>;
  prompt: string;
  negativePrompt: string;
}

function buildModelParamsKey(
  channelId: string,
  taskType: string,
  subType: string,
  modelId: string
): string {
  return `modelParams:${channelId}:${taskType}:${subType}:${modelId}`;
}

export { buildModelParamsKey };

// ========== 渠道配置 CRUD ==========
export async function getAllChannels(): Promise<Channel[]> {
  return db.channels.toArray();
}

export async function getChannel(id: string): Promise<Channel | undefined> {
  return db.channels.get(id);
}

export async function saveChannel(channel: Channel): Promise<void> {
  await db.channels.put(channel);
}

export async function deleteChannel(id: string): Promise<void> {
  await db.channels.delete(id);
  await db.channelKeys.delete(id);
}

export async function importChannels(channels: Channel[]): Promise<void> {
  await db.channels.bulkPut(channels);
}

// ========== API Key ==========
export async function saveChannelApiKey(channelId: string, apiKey: string): Promise<void> {
  await db.channelKeys.put({ channelId, apiKey });
}

export async function getChannelApiKey(channelId: string): Promise<string | undefined> {
  const record = await db.channelKeys.get(channelId);
  return record?.apiKey;
}

export async function getAllChannelApiKeys(): Promise<Map<string, string>> {
  const records = await db.channelKeys.toArray();
  const map = new Map<string, string>();
  for (const r of records) {
    map.set(r.channelId, r.apiKey);
  }
  return map;
}
