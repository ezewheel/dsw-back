import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class UserIdParamsDTO {
  @Matches(/^\d+$/, { message: "El id debe ser numérico" })
  id!: string;
}

export class UserSearchQueryDTO {
  @IsString({ message: "La consulta debe ser una cadena de texto" })
  query!: string;

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
