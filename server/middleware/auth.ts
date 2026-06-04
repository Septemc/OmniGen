import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "omni-gen-prompts-secret-key";
const TOKEN_EXPIRY = "24h";

export function getJwtSecret(): string {
  return JWT_SECRET;
}

export function getTokenExpiry(): string {
  return TOKEN_EXPIRY;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "未授权, 请先登录" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token 无效或已过期" });
  }
}
