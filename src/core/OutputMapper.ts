import type { OutputMapping } from "./types";

export class OutputMapper {
  static extract(
    rawResponse: unknown,
    mappings: OutputMapping[]
  ): Array<{
    kind: string;
    value: string;
    mimeType?: string;
    extension?: string;
  }> {
    const results: Array<{
      kind: string;
      value: string;
      mimeType?: string;
      extension?: string;
    }> = [];

    for (const mapping of mappings) {
      const value = this.getNestedValue(rawResponse, mapping.dataPath);
      if (value) {
        results.push({
          kind: mapping.kind,
          value: String(value),
          mimeType: mapping.mimeType,
          extension: mapping.extension,
        });
      }
    }

    return results;
  }

  private static getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== "object") return undefined;

    const keys = path.split(".");
    let current: any = obj;

    for (const key of keys) {
      // 处理数组索引，如 data[0]
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const arrKey = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        if (Array.isArray(current[arrKey])) {
          current = current[arrKey][index];
        } else {
          return undefined;
        }
      } else {
        if (current[key] === undefined) {
          return undefined;
        }
        current = current[key];
      }
    }

    return current;
  }

  static inferTaskId(rawResponse: unknown, taskIdPath?: string): string | undefined {
    if (!taskIdPath) return undefined;
    const value = this.getNestedValue(rawResponse, taskIdPath);
    return value ? String(value) : undefined;
  }

  static inferStatus(rawResponse: unknown, statusPath?: string): string | undefined {
    if (!statusPath) return undefined;
    const value = this.getNestedValue(rawResponse, statusPath);
    return value ? String(value).toLowerCase() : undefined;
  }
}

export default OutputMapper;
