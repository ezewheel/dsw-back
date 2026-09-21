import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "./musical-entity.entity.js";
import { Interaction } from "../interaction/interaction.entity.js";
import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../integrations/deezer/deezer.client.js";
import type { MusicalSearchResult } from "./dtos/search-result.dto.js";
import type { ArtistDetail } from "./dtos/artist-detail.dto.js";
import type { EntityInteractionsResult } from "./dtos/entity-interactions-result.dto.js";

const deezerClient = new DeezerClient();

export type SearchResult =
  | { ok: true; results: MusicalSearchResult }
  | { ok: false; error: "DEEZER_ERROR" }
  | { ok: false; error: "DB_ERROR" };

export type ArtistDetailResult =
  | { ok: true; data: ArtistDetail }
  | { ok: false; error: "DEEZER_ERROR" }
  | { ok: false; error: "DB_ERROR" };

export type EntityInteractionsServiceResult =
  | { ok: true; data: EntityInteractionsResult }
  | { ok: false; error: "DB_ERROR" };

export async function getEntityInteractions(input: {
  type: "track" | "album" | "artist";
  id: string;
  page: number;
  pageSize: number;
}): Promise<EntityInteractionsServiceResult> {
  const externalId = `${input.type}-${input.id}`;

  try {
    const entity = await orm.em.findOne(MusicalEntity, { externalId });

    if (!entity) {
      return {
        ok: true,
        data: {
          externalId,
          items: [],
          page: input.page,
          pageSize: input.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const [interactions, total] = await orm.em.findAndCount(
      Interaction,
      { musicalEntity: entity, deletedAt: null },
      {
        populate: ["user"],
        orderBy: { createdAt: "DESC" },
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      },
    );

    return {
      ok: true,
      data: {
        externalId,
        items: interactions.map((interaction) => ({
          id: interaction.id,
          user: {
            id: interaction.user.id!,
            nickname: interaction.user.nickname,
          },
          value: interaction.value,
          content: interaction.content ?? null,
          createdAt: interaction.createdAt.toISOString(),
        })),
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }
}

export async function getArtistDetail(
  externalId: string,
): Promise<ArtistDetailResult> {
  let artist;
  let topTracks;
  let albums;

  try {
    [artist, topTracks, albums] = await Promise.all([
      deezerClient.getArtist(externalId),
      deezerClient.getArtistTopTracks(externalId),
      deezerClient.getArtistAlbums(externalId),
    ]);
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }

  let ratings: Map<string, number>;

  try {
    ratings = await fetchAverageRatings({ type: "track", results: topTracks });
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }

  const topRatedTracks = topTracks
    .map((track) => ({
      externalId: String(track.id),
      title: track.title,
      album: {
        title: track.album.title,
        cover_medium: track.album.cover_medium,
      },
      averageRating: ratings.get(`track-${track.id}`) ?? null,
    }))
    .sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1))
    .slice(0, 5);

  return {
    ok: true,
    data: {
      externalId: String(artist.id),
      name: artist.name,
      picture_big: artist.picture_big,
      topTracks: topRatedTracks,
      albums: albums.map((album) => ({
        externalId: String(album.id),
        title: album.title,
        cover_big: album.cover_big,
        release_date: album.release_date,
      })),
    },
  };
}

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