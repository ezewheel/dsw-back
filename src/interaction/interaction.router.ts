import { Router } from "express";
import {
  CreateReviewDTO,
  EntityReviewsParamsDTO,
  EntityReviewsQueryDTO,
  LatestReviewsQueryDTO,
} from "./interaction.dto.js";
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