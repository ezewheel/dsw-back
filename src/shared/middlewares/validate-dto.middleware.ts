import type { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

type RequestSource = "body" | "query" | "params";

export const validateDTO =
  <T extends object>(dtoClass: new () => T, source: RequestSource = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(dtoClass, req[source] ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: errors.map((error) => ({
          property: error.property,
          messages: Object.values(error.constraints ?? {}),
        })),
      });
    }

    Object.defineProperty(req, source, {
      value: dto,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
