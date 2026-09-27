import type { Request, Response } from "express";
import {
  getEntityReviews as getEntityReviewsService,
  saveReview as saveReviewService,
  getLatestReviews as getLatestReviewsService,
  getLatestReviewedSongs as getLatestReviewedSongsService,
  getOwnReview as getOwnReviewService,
  deleteReview as deleteReviewService,
} from "./interaction.service.js";
import type {
  CreateReviewDTO,
  EntityReviewsParamsDTO,
  ReviewsPageQueryDTO,
  LatestReviewsQueryDTO,
} from "./interaction.dto.js";

export async function getEntityReviews(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  const { page, pageSize } = req.query as unknown as ReviewsPageQueryDTO;
  res.json(await getEntityReviewsService({ type, id, page, pageSize }));
}

export async function getLatestReviews(req: Request, res: Response) {
  const { page, pageSize } = req.query as unknown as ReviewsPageQueryDTO;
  res.json(await getLatestReviewsService({ page, pageSize }));
}

export async function saveReview(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  const { value, content } = req.body as CreateReviewDTO;
  const userId = req.user!.sub;

  const { review, created } = await saveReviewService({ type, id, userId, value, content });
  res.status(created ? 201 : 200).json(review);
}

export async function getLatestReviewedSongs(req: Request, res: Response) {
  const { limit } = req.query as unknown as LatestReviewsQueryDTO;
  res.json(await getLatestReviewedSongsService(limit));
}

export async function getOwnReview(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  res.json(await getOwnReviewService({ type, id, userId: req.user!.sub }));
}

export async function deleteReview(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  await deleteReviewService({ type, id, userId: req.user!.sub });
  res.status(204).end();
}
