import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { DeezerIdParamsDTO } from "../musical-entity/musical-entity.dto.js";

export class EntityReviewsParamsDTO extends DeezerIdParamsDTO {
  @IsIn(["track", "album", "artist"], {
    message: "El tipo debe ser track, album o artist",
  })
  type!: "track" | "album" | "artist";
}

export class EntityReviewsQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero" })
  @Min(1, { message: "La página debe ser al menos 1" })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño de página debe ser un número entero" })
  @Min(1, { message: "El tamaño de página debe ser al menos 1" })
  @Max(50, { message: "El tamaño de página no puede superar 50" })
  pageSize: number = 10;
}

export class LatestReviewsQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser al menos 1" })
  @Max(50, { message: "El límite no puede superar 50" })
  limit: number = 20;
}

const RATING_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export class CreateReviewDTO {
  @IsIn(RATING_VALUES, {
    message: "La puntuación debe ir de 0.5 a 5, de a media estrella",
  })
  value!: number;

  @IsOptional()
  @IsString({ message: "El contenido debe ser texto" })
  @MaxLength(1000, { message: "La reseña no puede superar los 1000 caracteres" })
  content?: string;
}
