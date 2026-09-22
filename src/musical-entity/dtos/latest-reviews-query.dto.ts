import { Transform } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : value;

export class LatestReviewsQueryDTO {
  @IsOptional()
  @Transform(toNumber)
  @IsInt({ message: "El límite debe ser un número entero" })
  @Min(1, { message: "El límite debe ser al menos 1" })
  @Max(50, { message: "El límite no puede superar 50" })
  limit: number = 20;
}