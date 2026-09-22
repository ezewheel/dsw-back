import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "../musical-entity/musical-entity.entity.js";
import { Interaction } from "./interaction.entity.js";
import { User } from "../user/user.entity.js";
import { DeezerClient } from "../integrations/deezer/deezer.client.js";
import { fetchEntityDisplay } from "../integrations/deezer/entity-display.js";
import type {
  EntityReview,
  EntityReviewsResult as EntityReviewsPaginated,
} from "./dtos/entity-reviews-result.dto.js";
import type { LatestReview } from "./dtos/latest-reviews.dto.js";
import type { ReviewedSong } from "./dtos/latest-reviewed-songs.dto.js";

const deezerClient = new DeezerClient();

export type EntityReviewsServiceResult =
  | { ok: true; data: EntityReviewsPaginated }
  | { ok: false; error: "DB_ERROR" };

export type CreateReviewResult =
  | { ok: true; data: EntityReview; created: boolean }
  | { ok: false; error: "USER_NOT_FOUND" | "DB_ERROR" };

export type LatestReviewsResult =
  | { ok: true; data: LatestReview[] }
  | { ok: false; error: "DB_ERROR" };

export type LatestReviewedSongsResult =
  | { ok: true; data: ReviewedSong[] }
  | { ok: false; error: "DB_ERROR" };

export async function getEntityReviews(input: {
  type: "track" | "album" | "artist";
  id: string;
  page: number;
  pageSize: number;
}): Promise<EntityReviewsServiceResult> {
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