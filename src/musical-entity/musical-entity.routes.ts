import { Router } from "express";
import { SearchRequestDTO } from "./dtos/search-request.dto.js";
import { ArtistParamsDTO } from "./dtos/artist-params.dto.js";
import { AlbumParamsDTO } from "./dtos/album-params.dto.js";
import { TrackParamsDTO } from "./dtos/track-params.dto.js";
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
  validateDTO(ArtistParamsDTO, "params"),
  getArtistDetail,
);
router.get(
  "/album/:id",
  validateDTO(AlbumParamsDTO, "params"),
  getAlbumDetail,
);
router.get(
  "/track/:id",
  validateDTO(TrackParamsDTO, "params"),
  getTrackDetail,
);

export default router;