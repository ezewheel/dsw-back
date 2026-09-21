import type {
  DeezerTrackDTO,
  DeezerAlbumDTO,
  DeezerArtistDTO,
} from "./dtos/deezer-responses.dto.js";

const DEEZER_BASE_URL = "https://api.deezer.com";

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
  async search({
    query,
    type,
    limit,
    index,
  }: DeezerSearchParams): Promise<DeezerSearchResult> {
    const url = `${DEEZER_BASE_URL}/search/${SEARCH_ENDPOINTS[type]}?q=${encodeURIComponent(query)}&limit=${limit}&index=${index}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al consultar Deezer: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Deezer devolvió un error: ${data.error.message}`);
    }

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
}
