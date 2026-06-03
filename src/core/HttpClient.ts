export class HttpClient {
  static async request(options: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string | FormData;
    timeout?: number;
  }): Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (options.timeout) {
      timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      return {
        ok: response.ok,
        status: response.status,
        json: () => response.json(),
        text: () => response.text(),
      };
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    }
  }

  static async downloadUrl(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return response.blob();
  }
}

export default HttpClient;
