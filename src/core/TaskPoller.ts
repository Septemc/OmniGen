import HttpClient from "./HttpClient";

export class TaskPoller {
  static async poll(options: {
    taskId: string;
    pollUrl: string;
    interval: number;
    maxDuration: number;
    headers?: Record<string, string>;
    statusField?: string;
    successStatus?: string;
    failedStatus?: string[];
  }): Promise<unknown> {
    const startTime = Date.now();

    while (true) {
      const elapsed = Date.now() - startTime;
      if (elapsed > options.maxDuration) {
        throw new Error("Polling timeout");
      }

      try {
        const response = await HttpClient.request({
          url: options.pollUrl,
          method: "GET",
          headers: options.headers,
        });

        if (response.ok) {
          const data = await response.json();
          const status = this.getStatus(data, options.statusField);

          if (status === (options.successStatus || "success")) {
            return data;
          }

          if (
            options.failedStatus?.includes(status) ||
            ["failed", "error", "cancelled", "rejected"].includes(status)
          ) {
            throw new Error(`Task failed with status: ${status}`);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Polling timeout") {
          throw error;
        }
        console.warn("Polling error, will retry:", error);
      }

      await this.sleep(options.interval);
    }
  }

  private static getStatus(data: unknown, statusField?: string): string {
    if (!statusField || typeof data !== "object" || !data) {
      return "unknown";
    }

    // 尝试从多个字段获取状态
    const statusKeys = [
      statusField,
      "status",
      "state",
      "result",
      "output.status",
    ];

    for (const key of statusKeys) {
      if (key) {
        const value = this.getNestedValue(data, key);
        if (value !== undefined) {
          return String(value).toLowerCase();
        }
      }
    }

    return "unknown";
  }

  private static getNestedValue(obj: any, path: string): unknown {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }
    return current;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default TaskPoller;
