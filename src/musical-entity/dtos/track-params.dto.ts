import { IsString, Matches } from "class-validator";

export class TrackParamsDTO {
  @IsString({ message: "El id debe ser una cadena de texto" })
  @Matches(/^\d+$/, { message: "El id de la canción debe ser numérico" })
  id!: string;
}