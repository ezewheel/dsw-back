import type { Request, Response } from "express";
import { search as searchService } from "./musical-entity.service.js";
import type { SearchRequestDTO } from "./dtos/search-request.dto.js";

export async function search(req: Request, res: Response) {
  const { query, type, limit, index } =
    req.query as unknown as SearchRequestDTO;
  const result = await searchService({ query, type, limit, index });

  if (!result.ok) {
    const status = result.error === "DEEZER_ERROR" ? 502 : 500;
    const message =
      result.error === "DEEZER_ERROR"
        ? "Error al consultar a Deezer"
        : "Error al consultar la base de datos";
    return res.status(status).json({ message });
  }

  return res.status(200).json(result.results);
}