import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

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
