import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginRequestDTO {
  @IsEmail({}, { message: "El email no tiene un formato válido" })
  email!: string;

  @IsString({ message: "La contraseña debe ser un string" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  password!: string;
}