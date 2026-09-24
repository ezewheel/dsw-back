import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

const toTrimmedLowercase = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class LoginRequestDTO {
  @Transform(toTrimmedLowercase)
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @IsString({ message: "La contraseña debe ser un string" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  // bcrypt ignora todo lo que pase de 72 bytes.
  @MaxLength(72, { message: "La contraseña no puede superar los 72 caracteres" })
  password!: string;
}
