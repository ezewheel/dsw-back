import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { LoginRequestDTO } from "./login-request.dto.js";

const toTrimmed = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class RegisterRequestDTO extends LoginRequestDTO {
  @Transform(toTrimmed)
  @IsString({ message: "El nickname debe ser un string" })
  @IsNotEmpty({ message: "El nickname no puede estar vacío" })
  nickname!: string;
}
