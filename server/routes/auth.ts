import { Router } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret, getTokenExpiry } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/verify", (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "请提供密码" });
    return;
  }

  const configuredPassword = process.env.PROMPTS_PASSWORD;

  if (!configuredPassword) {
    res.status(500).json({ error: "服务器未配置密码" });
    return;
  }

  if (password !== configuredPassword) {
    res.status(401).json({ error: "密码错误" });
    return;
  }

  const token = jwt.sign({}, getJwtSecret(), {
    expiresIn: 86400,
  });

  res.json({ token });
});
