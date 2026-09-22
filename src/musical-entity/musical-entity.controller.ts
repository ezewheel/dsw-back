import type { Request, Response } from "express";
import {
  search as searchService,
  getArtistDetail as getArtistDetailService,
  getAlbumDetail as getAlbumDetailService,
  getTopRated as getTopRatedService,
} from "./musical-entity.service.js";
import type { SearchRequestDTO } from "./dtos/search-request.dto.js";
import type { ArtistParamsDTO } from "./dtos/artist-params.dto.js";
import type { AlbumParamsDTO } from "./dtos/album-params.dto.js";

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

export async function getArtistDetail(req: Request, res: Response) {
  const { id } = req.params as unknown as ArtistParamsDTO;
  const result = await getArtistDetailService(id);

  if (!result.ok) {
    const status = result.error === "DEEZER_ERROR" ? 502 : 500;
    const message =
      result.error === "DEEZER_ERROR"
        ? "Error al consultar a Deezer"
        : "Error al consultar la base de datos";
    return res.status(status).json({ message });
  }

  return res.status(200).json(result.data);
}

export async function getAlbumDetail(req: Request, res: Response) {
  const { id } = req.params as unknown as AlbumParamsDTO;
  const result = await getAlbumDetailService(id);

  if (!result.ok) {
    const status = result.error === "DEEZER_ERROR" ? 502 : 500;
    const message =
      result.error === "DEEZER_ERROR"
        ? "Error al consultar a Deezer"
        : "Error al consultar la base de datos";
    return res.status(status).json({ message });
  }

  return res.status(200).json(result.data);
}

export async function getTopRated(req: Request, res: Response) {
  const result = await getTopRatedService();

  if (!result.ok) {
    return res.status(500).json({ message: "Error al consultar la base de datos" });
  }

  return res.status(200).json(result.data);
}