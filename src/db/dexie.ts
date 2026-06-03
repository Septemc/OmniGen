import Dexie, { Table } from "dexie";
import type { RunHistory, Channel } from "../core/types";

export class AppDB extends Dexie {
  history!: Table<RunHistory, string>;
  settings!: Table<{ key: string; value: any }, string>;
  channels!: Table<Channel, string>;
  channelKeys!: Table<{ channelId: string; apiKey: string }, string>;

  constructor() {
    super("omni-gen-db");
    this.version(2).stores({
      history: "id, createdAt, channelId, taskType, status",
      settings: "key",
      channels: "id, name, provider, enabled",
      channelKeys: "channelId",
    });
  }
}

export const db = new AppDB();
