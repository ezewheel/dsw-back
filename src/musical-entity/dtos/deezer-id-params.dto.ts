import { Matches } from "class-validator";

export class DeezerIdParamsDTO {
  @Matches(/^\d+$/, { message: "El id debe ser numérico" })
  id!: string;
}
