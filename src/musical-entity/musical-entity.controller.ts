import type { Request, Response } from "express";
import {
  search as searchService,
  getArtistDetail as getArtistDetailService,
  getAlbumDetail as getAlbumDetailService,
  getTrackDetail as getTrackDetailService,
  getTopRated as getTopRatedService,
} from "./musical-entity.service.js";
import type { SearchRequestDTO } from "./dtos/search-request.dto.js";
import type { ArtistParamsDTO } from "./dtos/artist-params.dto.js";
import type { AlbumParamsDTO } from "./dtos/album-params.dto.js";
import type { TrackParamsDTO } from "./dtos/track-params.dto.js";

export async function search(req: Request, res: Response) {
  res.json(await searchService(req.query as unknown as SearchRequestDTO));
}

export async function getArtistDetail(req: Request, res: Response) {
  const { id } = req.params as unknown as ArtistParamsDTO;
  res.json(await getArtistDetailService(id));
}

export async function getAlbumDetail(req: Request, res: Response) {
  const { id } = req.params as unknown as AlbumParamsDTO;
  res.json(await getAlbumDetailService(id));
}

export async function getTrackDetail(req: Request, res: Response) {
  const { id } = req.params as unknown as TrackParamsDTO;
  res.json(await getTrackDetailService(id));
}

export async function getTopRated(req: Request, res: Response) {
  res.json(await getTopRatedService());
}
