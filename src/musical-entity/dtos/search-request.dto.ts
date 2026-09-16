import { IsIn, IsString } from "class-validator";

export class SearchRequestDTO {
  @IsString({ message: "La consulta debe ser una cadena de texto" })
  query!: string;

  @IsIn(["track", "album", "artist"], {
    message: "El tipo debe ser track, album o artist",
  })
  type!: "track" | "album" | "artist";
}