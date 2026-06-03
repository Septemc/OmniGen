import type { Channel } from "./types";
import * as repo from "../db/repo";
import { DEFAULT_CHANNEL_TEMPLATES } from "./channelTemplates";

export class ChannelRegistry {
  private static cache: Map<string, Channel> = new Map();
  private static loaded = false;

  static async loadAll(): Promise<void> {
    if (this.loaded) return;
    try {
      let channels = await repo.getAllChannels();

      // 首次使用时自动写入默认渠道模板
      if (channels.length === 0) {
        await repo.importChannels(DEFAULT_CHANNEL_TEMPLATES);
        channels = DEFAULT_CHANNEL_TEMPLATES;
      }

      // 迁移：补全缺失的字段
      let dirty = false;
      for (const ch of channels) {
        // 修正旧域名
        if (ch.baseUrl === "https://api.moark.com/v1") {
          ch.baseUrl = "https://ai.gitee.com/v1";
          dirty = true;
        }
        for (const task of ch.tasks) {
          // 移除已废弃的 negativePrompt 参数字段（由 PromptEditor 统一处理）
          const before = task.paramSchema.length;
          task.paramSchema = task.paramSchema.filter((f) => f.key !== "negativePrompt");
          if (task.paramSchema.length !== before) dirty = true;

          for (const field of task.paramSchema) {
            // model 字段缺少 optionsFrom
            if (
              field.key === "model" &&
              field.type === "select" &&
              !field.optionsFrom &&
              !field.options?.length
            ) {
              field.optionsFrom = "@tasks[0]";
              dirty = true;
            }
          }
          // text_to_image 缺少 num_images_per_prompt
          if (
            task.type === "text_to_image" &&
            !task.paramSchema.some((f) => f.apiField === "num_images_per_prompt")
          ) {
            task.paramSchema.splice(2, 0, {
              key: "numImages",
              label: "生成数量",
              type: "number",
              apiField: "num_images_per_prompt",
              default: 1,
              min: 1,
              max: 4,
              advanced: true,
            });
            dirty = true;
          }
        }
      }
      if (dirty) {
        for (const ch of channels) {
          await repo.saveChannel(ch);
        }
      }

      this.cache.clear();
      for (const ch of channels) {
        this.cache.set(ch.id, ch);
      }
      this.loaded = true;
    } catch (error) {
      console.error("Failed to load channels from DB:", error);
    }
  }

  static get(id: string): Channel | undefined {
    return this.cache.get(id);
  }

  static getAll(): Channel[] {
    return Array.from(this.cache.values());
  }

  static getEnabled(): Channel[] {
    return this.getAll().filter((c) => c.enabled);
  }

  static async add(channel: Channel): Promise<void> {
    await repo.saveChannel(channel);
    this.cache.set(channel.id, channel);
  }

  static async update(channel: Channel): Promise<void> {
    await repo.saveChannel(channel);
    this.cache.set(channel.id, channel);
  }

  static async remove(id: string): Promise<void> {
    await repo.deleteChannel(id);
    this.cache.delete(id);
  }

  static async importMany(channels: Channel[]): Promise<void> {
    await repo.importChannels(channels);
    for (const ch of channels) {
      this.cache.set(ch.id, ch);
    }
  }

  static clear(): void {
    this.cache.clear();
    this.loaded = false;
  }
}

export default ChannelRegistry;
