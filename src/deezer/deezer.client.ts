import type {
  DeezerTrackDTO,
  DeezerAlbumDTO,
  DeezerAlbumTrackDTO,
  DeezerArtistDTO,
  DeezerAlbumListItemDTO,
  DeezerEntity,
} from "./deezer.types.js";
import type { MusicalEntityType } from "../musical-entity/musical-entity.entity.js";
import { HttpError } from "../shared/errors.js";

const DEEZER_BASE_URL = "https://api.deezer.com";
const DEEZER_NO_DATA_CODE = 800;
const ARTIST_TOP_TRACKS_LIMIT = 50;
const ALBUM_TRACKS_LIMIT = 100;

async function get<T>(path: string): Promise<T> {
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

async function getAllPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = path;

  while (next) {
    const page: { data: T[]; next?: string } = await get(next);
    items.push(...page.data);
    next = page.next ?? null;
  }

  return items;
}

export function search({
  query,
  type,
  limit,
  index,
}: {
  query: string;
  type: MusicalEntityType;
  limit: number;
  index: number;
}) {
  return get<{ data: DeezerEntity[]; total: number }>(
    `/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}&index=${index}`,
  );
}

export function getEntity(type: MusicalEntityType, id: number | string) {
  return get<DeezerEntity>(`/${type}/${id}`);
}

export function getArtist(id: number | string) {
  return get<DeezerArtistDTO>(`/artist/${id}`);
}

export function getAlbum(id: number | string) {
  return get<DeezerAlbumDTO>(`/album/${id}`);
}

export function getTrack(id: number | string) {
  return get<DeezerTrackDTO>(`/track/${id}`);
}

export async function getArtistTopTracks(id: number | string) {
  const { data } = await get<{ data: DeezerTrackDTO[] }>(
    `/artist/${id}/top?limit=${ARTIST_TOP_TRACKS_LIMIT}`,
  );
  return data;
}

export function getAlbumTracks(id: number | string) {
  return getAllPages<DeezerAlbumTrackDTO>(
    `/album/${id}/tracks?limit=${ALBUM_TRACKS_LIMIT}`,
  );
}

export function getArtistAlbums(id: number | string) {
  return getAllPages<DeezerAlbumListItemDTO>(`/artist/${id}/albums?limit=100`);
}
