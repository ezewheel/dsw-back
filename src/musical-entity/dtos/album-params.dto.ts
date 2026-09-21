import { IsString, Matches } from "class-validator";

export class AlbumParamsDTO {
  @IsString({ message: "El id debe ser una cadena de texto" })
  @Matches(/^\d+$/, { message: "El id del álbum debe ser numérico" })
  id!: string;
}