import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../../auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    req.user = verifyAuthToken(header.replace("Bearer ", ""));
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}