import { Router } from "express";
import {
  CreateReviewDTO,
  EntityReviewsParamsDTO,
  ReviewsPageQueryDTO,
  LatestReviewsQueryDTO,
} from "./interaction.dto.js";
import {
  getEntityReviews,
  saveReview,
  getLatestReviews,
  getLatestReviewedSongs,
  getOwnReview,
  deleteReview,
} from "./interaction.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";
import { requireAuth } from "../shared/middlewares/require-auth.middleware.js";

const router = Router();

router.get(
  "/reviews/latest",
  validateDTO(ReviewsPageQueryDTO, "query"),
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
  validateDTO(ReviewsPageQueryDTO, "query"),
  getEntityReviews,
);
router.post(
  "/:type/:id/reviews",
  requireAuth,
  validateDTO(EntityReviewsParamsDTO, "params"),
  validateDTO(CreateReviewDTO, "body"),
  saveReview,
);
router.get(
  "/:type/:id/reviews/own",
  requireAuth,
  validateDTO(EntityReviewsParamsDTO, "params"),
  getOwnReview,
);
router.delete(
  "/:type/:id/reviews",
  requireAuth,
  validateDTO(EntityReviewsParamsDTO, "params"),
  deleteReview,
);

export default router;