import { Router } from "express";
import { SearchRequestDTO } from "./dtos/search-request.dto.js";
import { ArtistParamsDTO } from "./dtos/artist-params.dto.js";
import { AlbumParamsDTO } from "./dtos/album-params.dto.js";
import { EntityReviewsParamsDTO } from "./dtos/entity-reviews-params.dto.js";
import { EntityReviewsQueryDTO } from "./dtos/entity-reviews-query.dto.js";
import { LatestReviewsQueryDTO } from "./dtos/latest-reviews-query.dto.js";
import {
  search,
  getArtistDetail,
  getAlbumDetail,
  getEntityReviews,
  getLatestReviews,
  getLatestReviewedSongs,
  getTopRated,
} from "./musical-entity.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";

const router = Router();

router.get(
  "/reviews/latest",
  validateDTO(LatestReviewsQueryDTO, "query"),
  getLatestReviews,
);
router.get(
  "/latest-reviewed-songs",
  validateDTO(LatestReviewsQueryDTO, "query"),
  getLatestReviewedSongs,
);
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
  "/:type/:id/reviews",
  validateDTO(EntityReviewsParamsDTO, "params"),
  validateDTO(EntityReviewsQueryDTO, "query"),
  getEntityReviews,
);

export default router;