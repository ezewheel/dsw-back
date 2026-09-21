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
import type { AlbumDetail } from "./dtos/album-detail.dto.js";
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

export type AlbumDetailResult =
  | { ok: true; data: AlbumDetail }
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
  const externalId = input.id;

  try {
    const entity = await orm.em.findOne(MusicalEntity, {
      type: input.type,
      deezerId: Number(input.id),
    });

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

  let ratings: Map<string, EntityStats>;

  try {
    ratings = await fetchEntityStats({ type: "track", results: topTracks });
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
      averageRating: ratings.get(String(track.id))?.averageRating ?? null,
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

export async function getAlbumDetail(
  externalId: string,
): Promise<AlbumDetailResult> {
  let album;

  try {
    album = await deezerClient.getAlbum(externalId);
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }

  const deezerTracks = album.tracks?.data ?? [];

  let trackStats: Map<string, EntityStats>;
  let albumStats: Map<string, EntityStats>;

  try {
    [trackStats, albumStats] = await Promise.all([
      fetchEntityStats({ type: "track", results: deezerTracks }),
      fetchEntityStats({ type: "album", results: [{ id: album.id }] }),
    ]);
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }

  const songs = deezerTracks.map((track) => {
    const stats = trackStats.get(String(track.id));
    return {
      externalId: String(track.id),
      title: track.title,
      duration: track.duration,
      averageRating: stats?.averageRating ?? null,
    };
  });

  const albumAverage = albumStats.get(String(album.id))?.averageRating ?? null;

  return {
    ok: true,
    data: {
      externalId: String(album.id),
      title: album.title,
      cover_big: album.cover_big,
      cover_medium: album.cover_medium,
      release_date: album.release_date,
      artist: { id: album.artist?.id, name: album.artist?.name ?? "" },
      averageRating: albumAverage,
      duration: songs.reduce((acc, song) => acc + song.duration, 0),
      songs,
    },
  };
}

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

async function fetchEntityStats(raw: {
  type: DeezerSearchType;
  results: { id: number }[];
}): Promise<Map<string, EntityStats>> {
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
