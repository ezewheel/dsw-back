import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class LatestReviewsQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser al menos 1" })
  @Max(50, { message: "El límite no puede superar 50" })
  limit: number = 20;
}
