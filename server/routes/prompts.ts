import { Router } from "express";
import fs from "fs";
import path from "path";

export const promptsRouter = Router();

function getPromptsDir(): string {
  return (
    process.env.PROMPTS_DIR ||
    path.resolve(process.cwd(), "..", "reference", "Prompts")
  );
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function sanitizeFilename(filename: string): string {
  const safe = path.basename(filename);
  if (!safe || safe === "..") {
    throw new Error("Invalid filename");
  }
  return safe;
}

promptsRouter.get("/", (_req, res) => {
  try {
    const dir = getPromptsDir();

    if (!fs.existsSync(dir)) {
      res.json([]);
      return;
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

    const prompts = files.map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const title = extractTitle(content);

      return {
        filename,
        title,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    });

    prompts.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );

    res.json(prompts);
  } catch (error) {
    console.error("Error listing prompts:", error);
    res.status(500).json({ error: "获取提示词列表失败" });
  }
});

promptsRouter.get("/:filename", (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(getPromptsDir(), filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "提示词文件不存在" });
      return;
    }

    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const title = extractTitle(content);

    res.json({
      filename,
      title,
      content,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Error reading prompt:", error);
    res.status(500).json({ error: "读取提示词失败" });
  }
});

promptsRouter.put("/:filename", (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const { content } = req.body;

    if (typeof content !== "string") {
      res.status(400).json({ error: "请提供内容" });
      return;
    }

    const dir = getPromptsDir();

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, filename);
    const isNew = !fs.existsSync(filePath);

    fs.writeFileSync(filePath, content, "utf-8");

    const stat = fs.statSync(filePath);
    const title = extractTitle(content);

    res.status(isNew ? 201 : 200).json({
      filename,
      title,
      content,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Error saving prompt:", error);
    res.status(500).json({ error: "保存提示词失败" });
  }
});

promptsRouter.delete("/:filename", (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename);
    const filePath = path.join(getPromptsDir(), filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "提示词文件不存在" });
      return;
    }

    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    res.status(500).json({ error: "删除提示词失败" });
  }
});
