import type { Request, Response } from "express";
import {
  getEntityReviews as getEntityReviewsService,
  saveReview as saveReviewService,
  getLatestReviews as getLatestReviewsService,
  getLatestReviewedSongs as getLatestReviewedSongsService,
} from "./interaction.service.js";
import type { EntityReviewsParamsDTO } from "./dtos/entity-reviews-params.dto.js";
import type { EntityReviewsQueryDTO } from "./dtos/entity-reviews-query.dto.js";
import type { LatestReviewsQueryDTO } from "./dtos/latest-reviews-query.dto.js";
import type { CreateReviewDTO } from "./dtos/create-review.dto.js";

export async function getEntityReviews(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  const { page, pageSize } = req.query as unknown as EntityReviewsQueryDTO;
  const result = await getEntityReviewsService({ type, id, page, pageSize });

  if (!result.ok) {
    return res.status(500).json({ message: "Error al consultar la base de datos" });
  }

  return res.status(200).json(result.data);
}

export async function getLatestReviews(req: Request, res: Response) {
  const { limit } = req.query as unknown as LatestReviewsQueryDTO;
  const result = await getLatestReviewsService(limit);

  if (!result.ok) {
    return res.status(500).json({ message: "Error al consultar la base de datos" });
  }

  return res.status(200).json(result.data);
}

export async function saveReview(req: Request, res: Response) {
  const { type, id } = req.params as unknown as EntityReviewsParamsDTO;
  const { value, content } = req.body as unknown as CreateReviewDTO;
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const result = await saveReviewService({ type, id, userId, value, content });

  if (!result.ok) {
    if (result.error === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.status(500).json({ message: "Error al guardar la reseña" });
  }

  return res.status(result.created ? 201 : 200).json(result.data);
}

export async function getLatestReviewedSongs(req: Request, res: Response) {
  const { limit } = req.query as unknown as LatestReviewsQueryDTO;
  const result = await getLatestReviewedSongsService(limit);

  if (!result.ok) {
    return res.status(500).json({ message: "Error al consultar la base de datos" });
  }

  return res.status(200).json(result.data);
}