import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class DeezerIdParamsDTO {
  @Matches(/^\d+$/, { message: "El id debe ser numérico" })
  id!: string;
}

export class SearchRequestDTO {
  @IsString({ message: "La consulta debe ser una cadena de texto" })
  query!: string;

  @IsIn(["track", "album", "artist"], {
    message: "El tipo debe ser track, album o artist",
  })
  type!: "track" | "album" | "artist";

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser al menos 1" })
  @Max(25, { message: "El límite no puede superar 25" })
  limit: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El índice debe ser un número entero" })
  @Min(0, { message: "El índice no puede ser negativo" })
  index: number = 0;
}
