import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "./musical-entity.entity.js";
import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../integrations/deezer/deezer.client.js";
import type { MusicalSearchResult } from "./dtos/search-result.dto.js";

const deezerClient = new DeezerClient();

export type SearchResult =
  | { ok: true; results: MusicalSearchResult }
  | { ok: false; error: "DEEZER_ERROR" }
  | { ok: false; error: "DB_ERROR" };

export async function search(input: {
  query: string;
  type: DeezerSearchType;
  limit: number;
  index: number;
}): Promise<SearchResult> {
  let raw: DeezerSearchResult;

  try {
    raw = await deezerClient.search(input);
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }

  if (raw.type === "artist") {
    raw.results.sort((a, b) => b.nb_fan - a.nb_fan);
  }

  let stats: Map<string, EntityStats>;

  try {
    stats = await fetchEntityStats(raw);
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }

  return { ok: true, results: project(raw, stats) };
}

type EntityStats = { averageRating: number | null; reviewsCount: number };

async function fetchEntityStats(
  raw: DeezerSearchResult,
): Promise<Map<string, EntityStats>> {
  const deezerIds = raw.results.map((r) => r.id);
  const entities = await orm.em.find(MusicalEntity, {
    type: raw.type,
    deezerId: { $in: deezerIds },
  });
  return new Map(
    entities.map((e) => [
      String(e.deezerId),
      { averageRating: e.averageRating, reviewsCount: e.reviewsCount },
    ]),
  );
}

function project(
  raw: DeezerSearchResult,
  stats: Map<string, EntityStats>,
): MusicalSearchResult {
  const entityStats = (r: { id: number }): EntityStats =>
    stats.get(String(r.id)) ?? { averageRating: null, reviewsCount: 0 };
  const averageRating = (r: { id: number }) => entityStats(r).averageRating;
  const reviewsCount = (r: { id: number }) => entityStats(r).reviewsCount;

  const hasMore = raw.index + raw.results.length < raw.total;

  switch (raw.type) {
    case "track":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          title: r.title,
          artist: { id: r.artist.id, name: r.artist.name },
          album: {
            id: r.album.id,
            title: r.album.title,
            cover_medium: r.album.cover_medium,
          },
          averageRating: averageRating(r),
          reviewsCount: reviewsCount(r),
        })),
        total: raw.total,
        hasMore,
      };
    case "album":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          title: r.title,
          cover_medium: r.cover_medium,
          artist: { id: r.artist.id, name: r.artist.name },
          averageRating: averageRating(r),
          reviewsCount: reviewsCount(r),
        })),
        total: raw.total,
        hasMore,
      };
    case "artist":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          name: r.name,
          picture_medium: r.picture_medium,
          averageRating: averageRating(r),
          reviewsCount: reviewsCount(r),
        })),
        total: raw.total,
        hasMore,
      };
  }
}
