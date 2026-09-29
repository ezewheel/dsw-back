import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { toTrimmed, toTrimmedLowercase } from "../auth/auth.dto.js";

export class UserIdParamsDTO {
  @Matches(/^\d+$/, { message: "El id debe ser numérico" })
  id!: string;
}

export class UserSearchQueryDTO {
  @IsString({ message: "La consulta debe ser una cadena de texto" })
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser al menos 1" })
  @Max(25, { message: "El límite no puede superar 25" })
  limit: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El índice debe ser un número entero" })
  @Min(0, { message: "El índice no puede ser negativo" })
  index: number = 0;
}

export class UpdateProfileDTO {
  @Transform(toTrimmedLowercase)
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @Transform(toTrimmed)
  @IsString({ message: "El nickname debe ser un string" })
  @IsNotEmpty({ message: "El nickname no puede estar vacío" })
  nickname!: string;
}

export class ChangePasswordDTO {
  @IsString({ message: "La contraseña actual debe ser un string" })
  @IsNotEmpty({ message: "Ingresá tu contraseña actual" })
  currentPassword!: string;

  @IsString({ message: "La contraseña nueva debe ser un string" })
  @MinLength(8, {
    message: "La contraseña nueva debe tener al menos 8 caracteres",
  })
  @MaxLength(72, {
    message: "La contraseña nueva no puede superar los 72 caracteres",
  })
  newPassword!: string;
}
