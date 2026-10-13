import { Transform, Type } from "class-transformer";
import {
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
import { toTrimmed } from "../shared/transforms.js";

export const NICKNAME_MAX_LENGTH = 30;

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
  @Transform(toTrimmed)
  @IsString({ message: "El nickname debe ser un string" })
  @IsNotEmpty({ message: "El nickname no puede estar vacío" })
  @MaxLength(NICKNAME_MAX_LENGTH, {
    message: `El nickname no puede superar los ${NICKNAME_MAX_LENGTH} caracteres`,
  })
  nickname!: string;
}

export class DeleteAccountDTO {
  @IsString({ message: "La contraseña debe ser un string" })
  @IsNotEmpty({ message: "Ingresá tu contraseña" })
  password!: string;
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
