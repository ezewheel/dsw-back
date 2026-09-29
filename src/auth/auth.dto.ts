import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { toTrimmed, toTrimmedLowercase } from "../shared/transforms.js";
import { NICKNAME_MAX_LENGTH } from "../user/user.dto.js";

export class LoginRequestDTO {
  @Transform(toTrimmedLowercase)
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @IsString({ message: "La contraseña debe ser un string" })
  @IsNotEmpty({ message: "Ingresá tu contraseña" })
  password!: string;
}

export class RegisterRequestDTO {
  @Transform(toTrimmedLowercase)
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @IsString({ message: "La contraseña debe ser un string" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(72, {
    message: "La contraseña no puede superar los 72 caracteres",
  })
  password!: string;

  @Transform(toTrimmed)
  @IsString({ message: "El nickname debe ser un string" })
  @IsNotEmpty({ message: "El nickname no puede estar vacío" })
  @MaxLength(NICKNAME_MAX_LENGTH, {
    message: `El nickname no puede superar los ${NICKNAME_MAX_LENGTH} caracteres`,
  })
  nickname!: string;
}
