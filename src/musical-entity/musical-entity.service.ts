import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "./musical-entity.entity.js";
import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../integrations/deezer/deezer.client.js";
import { fetchEntityDisplay } from "../integrations/deezer/entity-display.js";
import type { MusicalSearchResult } from "./dtos/search-result.dto.js";
import type { ArtistDetail } from "./dtos/artist-detail.dto.js";
import type { AlbumDetail } from "./dtos/album-detail.dto.js";
import type { TrackDetail } from "./dtos/track-detail.dto.js";
import type { TopRated } from "./dtos/top-rated.dto.js";

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

export type TrackDetailResult =
  | { ok: true; data: TrackDetail }
  | { ok: false; error: "DEEZER_ERROR" };

export type TopRatedResult =
  | { ok: true; data: TopRated }
  | { ok: false; error: "DB_ERROR" };

export async function getTopRated(): Promise<TopRatedResult> {
  try {
    const lists = await Promise.all(
      (["artist", "album", "track"] as const).map(async (type) => {
        const entities = await orm.em.find(
          MusicalEntity,
          { type, averageRating: { $gt: 0 } },
          {
            orderBy: { averageRating: "DESC", ratingsCount: "DESC" },
            limit: 5,
          },
        );

        const items: TopRated["artists"] = [];
        for (const entity of entities) {
          try {
            const display = await fetchEntityDisplay(
              type,
              String(entity.deezerId),
            );
            items.push({
              externalId: String(entity.deezerId),
              type,
              title: display.title,
              cover: display.cover,
              artist: display.artist,
              averageRating: entity.averageRating,
              reviewsCount: entity.ratingsCount,
            });
          } catch {
            // Entidad sin datos en Deezer: no entra en el listado.
          }
        }
        return items;
      }),
    );

    return {
      ok: true,
      data: {
        artists: lists[0],
        albums: lists[1],
        tracks: lists[2],
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
  let albumRatings: Map<string, EntityStats>;

  try {
    [ratings, albumRatings] = await Promise.all([
      fetchEntityStats({ type: "track", results: topTracks }),
      fetchEntityStats({ type: "album", results: albums }),
    ]);
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
    .filter((track) => track.averageRating !== null)
    .sort((a, b) => b.averageRating! - a.averageRating!)
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
        averageRating:
          albumRatings.get(String(album.id))?.averageRating ?? null,
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

export async function getTrackDetail(
  externalId: string,
): Promise<TrackDetailResult> {
  let track;

  try {
    track = await deezerClient.getTrack(externalId);
  } catch {
    return { ok: false, error: "DEEZER_ERROR" };
  }

  return {
    ok: true,
    data: {
      externalId: String(track.id),
      title: track.title,
      duration: track.duration,
      artist: { name: track.artist?.name ?? "" },
      album: {
        title: track.album?.title ?? "",
        cover_big: track.album?.cover_big ?? track.album?.cover_medium ?? "",
      },
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
