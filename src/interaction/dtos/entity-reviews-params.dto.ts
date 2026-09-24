import { IsIn } from "class-validator";
import { DeezerIdParamsDTO } from "../../musical-entity/dtos/deezer-id-params.dto.js";

export class EntityReviewsParamsDTO extends DeezerIdParamsDTO {
  @IsIn(["track", "album", "artist"], {
    message: "El tipo debe ser track, album o artist",
  })
  type!: "track" | "album" | "artist";
}
