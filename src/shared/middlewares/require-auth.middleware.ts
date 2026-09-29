import type { Request, Response, NextFunction } from "express";
import {
  accountSuspendedError,
  verifyAuthToken,
} from "../../auth/auth.service.js";
import { orm } from "../db/orm.js";
import { HttpError } from "../errors.js";
import { User } from "../../user/user.entity.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Token no proporcionado");
  }

  const userId = readUserId(header.replace("Bearer ", ""));
  const user = await orm.em.findOne(User, { id: userId });

  if (!user) {
    throw new HttpError(401, "Token inválido o expirado");
  }

  if (user.bannedAt) {
    throw accountSuspendedError();
  }

  req.user = user;
  next();
}

export function requireModerator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.role !== "moderator") {
    throw new HttpError(403, "Solo un moderador puede hacer esto");
  }

  next();
}

function readUserId(token: string): number {
  try {
    return verifyAuthToken(token).sub;
  } catch {
    throw new HttpError(401, "Token inválido o expirado");
  }
}
