import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

function fileSavePlugin(): Plugin {
  const outputDir = path.resolve(__dirname, "output");

  function handleSave(req: any, res: any, next: any) {
    if (req.method === "GET" && req.url?.startsWith("/output/")) {
      const safeName = path.basename(req.url).replace(/[<>:"/\\|?*]/g, "_");
      const filePath = path.join(outputDir, safeName);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(safeName).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
          ".webp": "image/webp", ".gif": "image/gif", ".json": "application/json",
        };
        res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.end(fs.readFileSync(filePath));
        return;
      }
      res.statusCode = 404;
      res.end("File not found");
      return;
    }

    if (req.method !== "POST" || !req.url?.startsWith("/api/save")) {
      next();
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf-8");
        let data: { filename: string; base64: string };
        try {
          data = JSON.parse(body);
        } catch {
          const params = new URLSearchParams(body);
          data = {
            filename: params.get("filename") || "untitled.png",
            base64: params.get("base64") || "",
          };
        }

        if (!data.filename || !data.base64) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing filename or base64" }));
          return;
        }

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const safeName = path.basename(data.filename).replace(/[<>:"/\\|?*]/g, "_");
        const filePath = path.join(outputDir, safeName);
        const buffer = Buffer.from(data.base64, "base64");
        fs.writeFileSync(filePath, buffer);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: true, path: `/output/${safeName}` }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
  }

  return {
    name: "file-save-plugin",
    configureServer(server) {
      server.middlewares.use(handleSave);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleSave);
    },
  };
}

export default defineConfig({
  plugins: [vue(), fileSavePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3558,
  },
  publicDir: "public",
});
