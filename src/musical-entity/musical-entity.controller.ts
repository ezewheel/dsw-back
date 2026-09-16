import type { Request, Response } from "express";
import { search as searchService } from "./musical-entity.service.js";
import type { SearchRequestDTO } from "./dtos/search-request.dto.js";

export async function search(req: Request, res: Response) {
  const { query, type } = req.query as unknown as SearchRequestDTO;
  const result = await searchService({ query, type });

  if (!result.ok) {
    return res.status(502).json({ message: "Error al consultar a Deezer" });
  }

  return res.status(200).json(result.results);
}