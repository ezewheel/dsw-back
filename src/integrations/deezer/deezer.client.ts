import type { DeezerAlbumDTO } from "./dtos/deezer-album.dto.js";
import type { DeezerArtistDTO } from "./dtos/deezer-artist.dto.js";
import type { DeezerTrackDTO } from "./dtos/deezer-track.dto.js";

const DEEZER_BASE_URL = "https://api.deezer.com";

export type DeezerSearchType = "track" | "album" | "artist";

export type DeezerSearchResult =
  | { type: "track"; results: DeezerTrackDTO[] }
  | { type: "album"; results: DeezerAlbumDTO[] }
  | { type: "artist"; results: DeezerArtistDTO[] };

const SEARCH_ENDPOINTS: Record<DeezerSearchType, string> = {
  track: "track",
  album: "album",
  artist: "artist",
};

export class DeezerClient {
  async search(
    query: string,
    type: DeezerSearchType,
  ): Promise<DeezerSearchResult> {
    const response = await fetch(
      `${DEEZER_BASE_URL}/search/${SEARCH_ENDPOINTS[type]}?q=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error(`Error al consultar Deezer: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Deezer devolvió un error: ${data.error.message}`);
    }

    const results = data.data;

    switch (type) {
      case "track":
        return { type, results: results as DeezerTrackDTO[] };
      case "album":
        return { type, results: results as DeezerAlbumDTO[] };
      case "artist":
        return { type, results: results as DeezerArtistDTO[] };
    }
  }
}
