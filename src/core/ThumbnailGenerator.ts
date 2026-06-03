export class ThumbnailGenerator {
  static async generateFromUrl(
    sourceUrl: string,
    maxSize: number = 256
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image for thumbnail"));
      img.src = sourceUrl;
    });
  }

  static async generateFromBlob(
    blob: Blob,
    maxSize: number = 256
  ): Promise<string> {
    const url = URL.createObjectURL(blob);
    try {
      return await ThumbnailGenerator.generateFromUrl(url, maxSize);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export default ThumbnailGenerator;
