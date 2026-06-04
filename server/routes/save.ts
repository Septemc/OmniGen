import { Router } from "express";
import fs from "fs";
import path from "path";

export const saveRouter = Router();

function getOutputDir(): string {
  return process.env.OUTPUT_DIR || path.resolve(process.cwd(), "..", "output");
}

saveRouter.post("/", (req, res) => {
  try {
    const { filename, base64 } = req.body;

    if (!filename || !base64) {
      res.status(400).json({ error: "Missing filename or base64" });
      return;
    }

    const dir = getOutputDir();

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const safeName = path.basename(filename).replace(/[<>:"/\\|?*]/g, "_");
    const filePath = path.join(dir, safeName);
    const buffer = Buffer.from(base64, "base64");

    fs.writeFileSync(filePath, buffer);

    res.json({ success: true, path: `/output/${safeName}` });
  } catch (e) {
    console.error("Error saving file:", e);
    res.status(500).json({ error: "保存文件失败" });
  }
});
