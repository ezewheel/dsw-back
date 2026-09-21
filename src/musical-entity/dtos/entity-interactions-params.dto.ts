import { IsIn, IsString, Matches } from "class-validator";

export class EntityInteractionsParamsDTO {
  @IsIn(["track", "album", "artist"], {
    message: "El tipo debe ser track, album o artist",
  })
  type!: "track" | "album" | "artist";

  @IsString({ message: "El id debe ser una cadena de texto" })
  @Matches(/^\d+$/, { message: "El id de la entidad debe ser numérico" })
  id!: string;
}