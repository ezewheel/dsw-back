import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

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
