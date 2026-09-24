import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "./musical-entity.entity.js";
import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../deezer/deezer.client.js";
import { fetchEntityDisplay } from "../deezer/entity-display.js";
import type {
  AlbumDetail,
  ArtistDetail,
  MusicalSearchResult,
  TopRated,
  TrackDetail,
} from "./musical-entity.types.js";

const deezerClient = new DeezerClient();

export async function getTopRated(): Promise<TopRated> {
  const [artists, albums, tracks] = await Promise.all(
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

  return { artists, albums, tracks };
}

export async function getArtistDetail(
  externalId: string,
): Promise<ArtistDetail> {
  const [artist, topTracks, albums] = await Promise.all([
    deezerClient.getArtist(externalId),
    deezerClient.getArtistTopTracks(externalId),
    deezerClient.getArtistAlbums(externalId),
  ]);

  const [ratings, albumRatings, artistRating] = await Promise.all([
    fetchEntityStats({ type: "track", results: topTracks }),
    fetchEntityStats({ type: "album", results: albums }),
    findEntityRating("artist", artist.id),
  ]);

  const topRatedTracks = topTracks
    .map((track) => ({
      externalId: String(track.id),
      title: track.title,
      album: {
        id: track.album.id,
        title: track.album.title,
        cover_medium: track.album.cover_medium,
      },
      averageRating: ratings.get(String(track.id))?.averageRating ?? null,
    }))
    .filter((track) => track.averageRating !== null)
    .sort((a, b) => b.averageRating! - a.averageRating!)
    .slice(0, 5);

  return {
    externalId: String(artist.id),
    name: artist.name,
    picture_big: artist.picture_big,
    ...artistRating,
    topTracks: topRatedTracks,
    albums: albums.map((album) => ({
      externalId: String(album.id),
      title: album.title,
      cover_big: album.cover_big,
      release_date: album.release_date,
      averageRating: albumRatings.get(String(album.id))?.averageRating ?? null,
    })),
  };
}

export async function getAlbumDetail(externalId: string): Promise<AlbumDetail> {
  const album = await deezerClient.getAlbum(externalId);
  const deezerTracks = album.tracks?.data ?? [];

  const [trackStats, albumStats] = await Promise.all([
    fetchEntityStats({ type: "track", results: deezerTracks }),
    fetchEntityStats({ type: "album", results: [{ id: album.id }] }),
  ]);

  const songs = deezerTracks.map((track) => ({
    externalId: String(track.id),
    title: track.title,
    duration: track.duration,
    averageRating: trackStats.get(String(track.id))?.averageRating ?? null,
  }));

  return {
    externalId: String(album.id),
    title: album.title,
    cover_big: album.cover_big,
    cover_medium: album.cover_medium,
    release_date: album.release_date,
    artist: { id: album.artist.id, name: album.artist.name },
    averageRating: albumStats.get(String(album.id))?.averageRating ?? null,
    duration: songs.reduce((acc, song) => acc + song.duration, 0),
    songs,
  };
}

export async function getTrackDetail(externalId: string): Promise<TrackDetail> {
  const track = await deezerClient.getTrack(externalId);
  const rating = await findEntityRating("track", track.id);

  return {
    externalId: String(track.id),
    title: track.title,
    duration: track.duration,
    artist: { id: track.artist.id, name: track.artist.name },
    album: {
      id: track.album.id,
      title: track.album.title,
      cover_big: track.album.cover_big ?? track.album.cover_medium,
    },
    ...rating,
  };
}

export async function search(input: {
  query: string;
  type: DeezerSearchType;
  limit: number;
  index: number;
}): Promise<MusicalSearchResult> {
  const raw = await deezerClient.search(input);

  if (raw.type === "artist") {
    raw.results.sort((a, b) => b.nb_fan - a.nb_fan);
  }

  const stats = await fetchEntityStats(raw);
  return project(raw, stats);
}

type EntityStats = { averageRating: number | null; reviewsCount: number };

type EntityRating = { averageRating: number | null; ratingsCount: number };

async function findEntityRating(
  type: DeezerSearchType,
  deezerId: number,
): Promise<EntityRating> {
  const entity = await orm.em.findOne(MusicalEntity, { type, deezerId });
  return {
    averageRating: entity?.averageRating || null,
    ratingsCount: entity?.ratingsCount ?? 0,
  };
}

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
