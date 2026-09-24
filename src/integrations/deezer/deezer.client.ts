import type {
  DeezerTrackDTO,
  DeezerAlbumDTO,
  DeezerArtistDTO,
  DeezerAlbumListItemDTO,
} from "./dtos/deezer-responses.dto.js";
import { HttpError } from "../../shared/errors.js";

const DEEZER_BASE_URL = "https://api.deezer.com";
// Deezer responde 200 con este código de error cuando el id no existe.
const DEEZER_NO_DATA_CODE = 800;

export type DeezerSearchType = "track" | "album" | "artist";

export interface DeezerSearchParams {
  query: string;
  type: DeezerSearchType;
  limit: number;
  index: number;
}

export type DeezerSearchResult =
  | { type: "track"; results: DeezerTrackDTO[]; total: number; index: number }
  | { type: "album"; results: DeezerAlbumDTO[]; total: number; index: number }
  | { type: "artist"; results: DeezerArtistDTO[]; total: number; index: number };

const SEARCH_ENDPOINTS: Record<DeezerSearchType, string> = {
  track: "track",
  album: "album",
  artist: "artist",
};

export class DeezerClient {
  private async get<T>(path: string): Promise<T> {
    const url = path.startsWith("http") ? path : `${DEEZER_BASE_URL}${path}`;
    const response = await fetch(url).catch(() => null);
    const data = response?.ok ? await response.json() : null;

    if (data?.error?.code === DEEZER_NO_DATA_CODE) {
      throw new HttpError(404, "No se encontró el contenido solicitado");
    }

    if (!data || data.error) {
      throw new HttpError(502, "Error al consultar a Deezer");
    }

    return data as T;
  }

  async search({
    query,
    type,
    limit,
    index,
  }: DeezerSearchParams): Promise<DeezerSearchResult> {
    const data = await this.get<{ data: unknown[]; total: number }>(
      `/search/${SEARCH_ENDPOINTS[type]}?q=${encodeURIComponent(query)}&limit=${limit}&index=${index}`,
    );

    const results = data.data;
    const total = data.total as number;

    switch (type) {
      case "track":
        return { type, results: results as DeezerTrackDTO[], total, index };
      case "album":
        return { type, results: results as DeezerAlbumDTO[], total, index };
      case "artist":
        return { type, results: results as DeezerArtistDTO[], total, index };
    }
  }

  async getArtist(id: number | string): Promise<DeezerArtistDTO> {
    return this.get<DeezerArtistDTO>(`/artist/${id}`);
  }

  async getAlbum(id: number | string): Promise<DeezerAlbumDTO> {
    return this.get<DeezerAlbumDTO>(`/album/${id}`);
  }

  async getTrack(id: number | string): Promise<DeezerTrackDTO> {
    return this.get<DeezerTrackDTO>(`/track/${id}`);
  }

  async getArtistTopTracks(
    id: number | string,
    limit = 50,
  ): Promise<DeezerTrackDTO[]> {
    const data = await this.get<{ data: DeezerTrackDTO[] }>(
      `/artist/${id}/top?limit=${limit}`,
    );
    return data.data;
  }

  async getArtistAlbums(
    id: number | string,
  ): Promise<DeezerAlbumListItemDTO[]> {
    const albums: DeezerAlbumListItemDTO[] = [];
    let next: string | null = `/artist/${id}/albums?limit=100`;

    while (next) {
      const page: {
        data: DeezerAlbumListItemDTO[];
        next?: string | null;
      } = await this.get(next);
      albums.push(...page.data);
      next = page.next ?? null;
    }

    return albums;
  }
}