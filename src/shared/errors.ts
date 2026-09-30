import type { NextFunction, Request, Response } from "express";
import { UniqueConstraintViolationException } from "@mikro-orm/core";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ message: err.message, code: err.code });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res
      .status(400)
      .json({ message: "El cuerpo de la solicitud no es un JSON válido" });
  }

  if (err instanceof UniqueConstraintViolationException) {
    return res.status(409).json({ message: "Ese valor ya está en uso" });
  }

  console.error(err);
  return res.status(500).json({ message: "Error interno del servidor" });
}
