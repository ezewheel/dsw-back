import {
  registerDecorator,
  type ValidationOptions,
} from "class-validator";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

function IsHalfStep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isHalfStep",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === "number" && Number.isInteger(value * 2);
        },
        defaultMessage: () =>
          "La puntuación debe subir de a media estrella",
      },
    });
  };
}

export class CreateReviewDTO {
  @IsNumber({ maxDecimalPlaces: 1 }, { message: "La puntuación debe ser un número" })
  @IsHalfStep({ message: "La puntuación debe subir de a media estrella" })
  @Min(0.5, { message: "La puntuación mínima es 0.5" })
  @Max(5, { message: "La puntuación máxima es 5" })
  value!: number;

  @IsOptional()
  @IsString({ message: "El contenido debe ser texto" })
  @MaxLength(1000, { message: "La reseña no puede superar los 1000 caracteres" })
  content?: string;
}