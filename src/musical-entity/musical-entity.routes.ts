import { Router } from "express";
import { SearchRequestDTO } from "./dtos/search-request.dto.js";
import { DeezerIdParamsDTO } from "./dtos/deezer-id-params.dto.js";
import {
  search,
  getArtistDetail,
  getAlbumDetail,
  getTrackDetail,
  getTopRated,
} from "./musical-entity.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";

const router = Router();

router.get("/top-rated", getTopRated);
router.get("/search", validateDTO(SearchRequestDTO, "query"), search);
router.get(
  "/artist/:id",
  validateDTO(DeezerIdParamsDTO, "params"),
  getArtistDetail,
);
router.get(
  "/album/:id",
  validateDTO(DeezerIdParamsDTO, "params"),
  getAlbumDetail,
);
router.get(
  "/track/:id",
  validateDTO(DeezerIdParamsDTO, "params"),
  getTrackDetail,
);

export default router;