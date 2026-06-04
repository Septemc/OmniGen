import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { promptsRouter } from "./routes/prompts.js";
import { saveRouter } from "./routes/save.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

console.log(`[startup] PROMPTS_PASSWORD=${process.env.PROMPTS_PASSWORD ? "已设置(" + process.env.PROMPTS_PASSWORD.length + "字符)" : "未设置!"}`);
console.log(`[startup] PORT=${PORT}`);
console.log(`[startup] PROMPTS_DIR=${process.env.PROMPTS_DIR || "(default)"}`);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRouter);
app.use("/api/prompts", authMiddleware, promptsRouter);
app.use("/api/save", saveRouter);

app.listen(PORT, () => {
  console.log(`Prompts server running on http://localhost:${PORT}`);
});
