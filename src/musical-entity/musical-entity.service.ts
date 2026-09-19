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
}): Promise<SearchResult> {
  let raw: DeezerSearchResult;

  try {
    raw = await deezerClient.search(input.query, input.type);
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }

  if (raw.type === "artist") {
    raw.results.sort((a, b) => b.nb_fan - a.nb_fan);
  }

  let ratings: Map<string, number>;

  try {
    ratings = await fetchAverageRatings(raw);
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }

  return { ok: true, results: project(raw, ratings) };
}

async function fetchAverageRatings(
  raw: DeezerSearchResult,
): Promise<Map<string, number>> {
  const externalIds = raw.results.map((r) => `${raw.type}-${r.id}`);
  const entities = await orm.em.find(MusicalEntity, {
    externalId: { $in: externalIds },
  });
  return new Map(entities.map((e) => [e.externalId, e.averageRating]));
}

function project(
  raw: DeezerSearchResult,
  ratings: Map<string, number>,
): MusicalSearchResult {
  const lookupKey = (r: { id: number }) => `${raw.type}-${r.id}`;
  const averageRating = (r: { id: number }) =>
    ratings.get(lookupKey(r)) ?? null;

  switch (raw.type) {
    case "track":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          title: r.title,
          artist: { name: r.artist.name },
          album: { cover_medium: r.album.cover_medium },
          averageRating: averageRating(r),
        })),
      };
    case "album":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          title: r.title,
          cover_medium: r.cover_medium,
          artist: { name: r.artist.name },
          averageRating: averageRating(r),
        })),
      };
    case "artist":
      return {
        results: raw.results.map((r) => ({
          externalId: String(r.id),
          type: raw.type,
          name: r.name,
          picture_medium: r.picture_medium,
          averageRating: averageRating(r),
        })),
      };
  }
}