import { Router } from "express";
import { EntityReviewsParamsDTO } from "./dtos/entity-reviews-params.dto.js";
import { EntityReviewsQueryDTO } from "./dtos/entity-reviews-query.dto.js";
import { LatestReviewsQueryDTO } from "./dtos/latest-reviews-query.dto.js";
import { CreateReviewDTO } from "./dtos/create-review.dto.js";
import {
  getEntityReviews,
  saveReview,
  getLatestReviews,
  getLatestReviewedSongs,
} from "./interaction.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";
import { requireAuth } from "../shared/middlewares/require-auth.middleware.js";

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
router.get(
  "/:type/:id/reviews",
  validateDTO(EntityReviewsParamsDTO, "params"),
  validateDTO(EntityReviewsQueryDTO, "query"),
  getEntityReviews,
);
router.post(
  "/:type/:id/reviews",
  requireAuth,
  validateDTO(EntityReviewsParamsDTO, "params"),
  validateDTO(CreateReviewDTO, "body"),
  saveReview,
);

export default router;