import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "./musical-entity.entity.js";
import { Interaction } from "../interaction/interaction.entity.js";
import { User } from "../user/user.entity.js";
import {
  DeezerClient,
  type DeezerSearchResult,
  type DeezerSearchType,
} from "../integrations/deezer/deezer.client.js";
import type { MusicalSearchResult } from "./dtos/search-result.dto.js";
import type { ArtistDetail } from "./dtos/artist-detail.dto.js";
import type { AlbumDetail } from "./dtos/album-detail.dto.js";
import type {
  EntityReview,
  EntityReviewsResult as EntityReviewsPaginated,
} from "./dtos/entity-reviews-result.dto.js";
import type { LatestReview } from "./dtos/latest-reviews.dto.js";
import type { TopRated } from "./dtos/top-rated.dto.js";
import type { ReviewedSong } from "./dtos/latest-reviewed-songs.dto.js";

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

export type EntityReviewsResult =
  | { ok: true; data: EntityReviewsPaginated }
  | { ok: false; error: "DB_ERROR" };

export type CreateReviewResult =
  | { ok: true; data: EntityReview; created: boolean }
  | { ok: false; error: "USER_NOT_FOUND" | "DB_ERROR" };

export type LatestReviewsResult =
  | { ok: true; data: LatestReview[] }
  | { ok: false; error: "DB_ERROR" };

export type TopRatedResult =
  | { ok: true; data: TopRated }
  | { ok: false; error: "DB_ERROR" };

export type LatestReviewedSongsResult =
  | { ok: true; data: ReviewedSong[] }
  | { ok: false; error: "DB_ERROR" };

export async function getLatestReviewedSongs(
  limit: number,
): Promise<LatestReviewedSongsResult> {
  try {
    const interactions = await orm.em.find(
      Interaction,
      {
        deletedAt: null,
        value: { $gt: 0 },
        musicalEntity: { type: "track" },
      },
      {
        populate: ["musicalEntity"],
        orderBy: { createdAt: "DESC" },
        limit: Math.max(limit * 5, 50),
      },
    );

    const seen = new Set<string>();
    const songs: ReviewedSong[] = [];
    for (const interaction of interactions) {
      const entity = interaction.musicalEntity;
      const id = String(entity.deezerId);
      if (seen.has(id)) continue;
      seen.add(id);

      try {
        const track = await deezerClient.getTrack(id);
        songs.push({
          externalId: id,
          title: track.title,
          artist: track.artist?.name ?? null,
          album: track.album?.title ?? null,
          duration: track.duration ?? null,
          cover: track.album?.cover_medium ?? null,
          averageRating: entity.averageRating || null,
          reviewsCount: entity.ratingsCount,
          reviewedAt: interaction.createdAt.toISOString(),
        });
      } catch {
        // Canción sin datos en Deezer: no entra al listado.
      }

      if (songs.length === limit) break;
    }

    return { ok: true, data: songs };
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }
}

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

export async function getLatestReviews(limit: number): Promise<LatestReviewsResult> {
  try {
    const interactions = await orm.em.find(
      Interaction,
      { deletedAt: null, content: { $ne: null } },
      {
        populate: ["user", "musicalEntity"],
        orderBy: { createdAt: "DESC" },
        limit,
      },
    );

    const uniqueEntities = new Map<string, MusicalEntity>();
    for (const interaction of interactions) {
      const entity = interaction.musicalEntity;
      uniqueEntities.set(`${entity.type}:${entity.deezerId}`, entity);
    }

    const entityInfo = new Map<string, LatestReview["entity"] | null>();
    await Promise.all(
      [...uniqueEntities.values()].map(async (entity) => {
        const key = `${entity.type}:${entity.deezerId}`;
        try {
          entityInfo.set(key, await fetchEntityDisplay(entity.type, String(entity.deezerId)));
        } catch {
          entityInfo.set(key, null);
        }
      }),
    );

    return {
      ok: true,
      data: interactions.map((interaction) => {
        const entity = interaction.musicalEntity;
        const key = `${entity.type}:${entity.deezerId}`;
        const info = entityInfo.get(key);

        return {
          id: interaction.id,
          user: {
            id: interaction.user.id!,
            nickname: interaction.user.nickname,
          },
          value: interaction.value,
          content: interaction.content!,
          createdAt: interaction.createdAt.toISOString(),
          updatedAt: interaction.updatedAt.toISOString(),
          entity:
            info ?? {
              externalId: String(entity.deezerId),
              type: entity.type,
              title: null,
              cover: null,
              artist: null,
            },
        };
      }),
    };
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }
}

async function fetchEntityDisplay(
  type: "track" | "album" | "artist",
  externalId: string,
): Promise<LatestReview["entity"]> {
  if (type === "artist") {
    const artist = await deezerClient.getArtist(externalId);
    return {
      externalId,
      type,
      title: artist.name,
      cover: artist.picture_big,
      artist: null,
    };
  }

  if (type === "album") {
    const album = await deezerClient.getAlbum(externalId);
    return {
      externalId,
      type,
      title: album.title,
      cover: album.cover_big,
      artist: album.artist?.name ?? null,
    };
  }

  const track = await deezerClient.getTrack(externalId);
  return {
    externalId,
    type,
    title: track.title,
    cover: track.album?.cover_medium ?? null,
    artist: track.artist?.name ?? null,
  };
}

export async function getEntityReviews(input: {
  type: "track" | "album" | "artist";
  id: string;
  page: number;
  pageSize: number;
}): Promise<EntityReviewsResult> {
  try {
    const entity = await orm.em.findOne(MusicalEntity, {
      type: input.type,
      deezerId: Number(input.id),
    });

    if (!entity) {
      return {
        ok: true,
        data: {
          externalId: input.id,
          page: input.page,
          pageSize: input.pageSize,
          total: 0,
          totalPages: 0,
          items: [],
        },
      };
    }

    const [interactions, total] = await orm.em.findAndCount(
      Interaction,
      { musicalEntity: entity, deletedAt: null, content: { $ne: null } },
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
        externalId: input.id,
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
        items: interactions.map((interaction) => ({
          id: interaction.id,
          user: {
            id: interaction.user.id!,
            nickname: interaction.user.nickname,
          },
          value: interaction.value,
          content: interaction.content!,
          createdAt: interaction.createdAt.toISOString(),
          updatedAt: interaction.updatedAt.toISOString(),
        })),
      },
    };
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }
}

export async function createReview(input: {
  type: "track" | "album" | "artist";
  id: string;
  userId: number;
  value: number;
  content?: string;
}): Promise<CreateReviewResult> {
  const em = orm.em;

  try {
    let entity = await em.findOne(MusicalEntity, {
      type: input.type,
      deezerId: Number(input.id),
    });

    if (!entity) {
      entity = em.create(MusicalEntity, {
        type: input.type,
        deezerId: Number(input.id),
        reviewsCount: 0,
        ratingsCount: 0,
        averageRating: 0,
      });
    }

    const user = await em.findOne(User, { id: input.userId });

    if (!user) {
      return { ok: false, error: "USER_NOT_FOUND" };
    }

    const content = input.content?.trim() || undefined;

    let interaction = await em.findOne(Interaction, {
      user,
      musicalEntity: entity,
    });

    let created = false;

    if (interaction) {
      interaction.deletedAt = null as unknown as Date | undefined;
      interaction.value = input.value;
      if (content !== undefined) {
        interaction.content = content;
      }
      interaction.updatedAt = new Date();
      em.persist(interaction);
    } else {
      interaction = em.create(Interaction, {
        user,
        musicalEntity: entity,
        value: input.value,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created = true;
    }

    await em.flush();
    await refreshEntityStats(entity);

    return {
      ok: true,
      created,
      data: {
        id: interaction.id!,
        user: {
          id: user.id!,
          nickname: user.nickname,
        },
        value: interaction.value,
        content: interaction.content ?? "",
        createdAt: interaction.createdAt.toISOString(),
        updatedAt: interaction.updatedAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, error: "DB_ERROR" };
  }
}

async function refreshEntityStats(entity: MusicalEntity): Promise<void> {
  const interactions = await orm.em.find(Interaction, {
    musicalEntity: entity,
    deletedAt: null,
  });

  const withContent = interactions.filter(
    (interaction) => interaction.content !== null && interaction.content !== undefined,
  );

  entity.ratingsCount = interactions.length;
  entity.reviewsCount = withContent.length;
  entity.averageRating =
    interactions.length === 0
      ? 0
      : interactions.reduce(
          (sum, interaction) => sum + Number(interaction.value),
          0,
        ) / interactions.length;

  await orm.em.persist(entity).flush();
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
