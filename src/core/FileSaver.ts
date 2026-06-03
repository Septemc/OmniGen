import type { OutputConfig, ExecutionInput } from "./types";

export class FileSaver {
  static async saveToServer(
    blob: Blob,
    filename: string
  ): Promise<{ url: string; path: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, base64 }),
          });
          if (!response.ok) throw new Error(`Save failed: ${response.status}`);
          const data = await response.json();
          resolve({ url: data.path, path: data.path, filename });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });
  }

  static async saveFromBlob(
    blob: Blob,
    filename: string
  ): Promise<{ url: string; filename: string }> {
    const url = URL.createObjectURL(blob);
    return { url, filename };
  }

  static b64ToBlob(base64: string, mimeType: string = "image/png"): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  static async saveFromBase64(
    base64: string,
    filename: string,
    mimeType: string = "image/png"
  ): Promise<{ url: string; filename: string }> {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return this.saveFromBlob(blob, filename);
  }

  static generateFilename(
    input: ExecutionInput,
    config: OutputConfig,
    modelName?: string
  ): string {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");

    const promptSubstr = input.prompt.substring(0, config.promptSubstrLen).replace(/[^\w\u4e00-\u9fa5]/g, "_");

    let filename = config.namingTemplate
      .replace("{date}", date)
      .replace("{time}", time)
      .replace("{channel}", input.channelId)
      .replace("{model}", modelName || input.model || "unknown")
      .replace("{task}", input.taskType)
      .replace("{prompt20}", promptSubstr)
      .replace("{seed}", String(input.params.seed || Date.now()));

    if (!filename.endsWith(".png") && !filename.endsWith(".jpg") && !filename.endsWith(".jpeg") && !filename.endsWith(".webp")) {
      filename += ".png";
    }

    return filename;
  }

  static triggerDownload(url: string, filename: string): void {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default FileSaver;
