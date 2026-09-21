import { IsString, Matches } from "class-validator";

export class ArtistParamsDTO {
  @IsString({ message: "El id debe ser una cadena de texto" })
  @Matches(/^\d+$/, { message: "El id del artista debe ser numérico" })
  id!: string;
}