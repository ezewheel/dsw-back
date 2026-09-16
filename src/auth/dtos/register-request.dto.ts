import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

const toTrimmedEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const toTrimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class RegisterRequestDTO {
  @Transform(toTrimmedEmail)
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @IsString({ message: "La contraseña debe ser un string" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  password!: string;

  @Transform(toTrimmed)
  @IsString({ message: "El nickname debe ser un string" })
  @IsNotEmpty({ message: "El nickname no puede estar vacío" })
  nickname!: string;
}