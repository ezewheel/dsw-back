import type { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export const validateDTO =
  <T extends object>(dtoClass: new () => T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(dtoClass, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: errors.map((error) => ({
          property: error.property,
          messages: Object.values(error.constraints ?? {}),
        })),
      });
    }

    req.body = dto;
    next();
  };