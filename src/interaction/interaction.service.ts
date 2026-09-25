import { orm } from "../shared/db/orm.js";
import {
  MusicalEntity,
  type MusicalEntityType,
} from "../musical-entity/musical-entity.entity.js";
import { Interaction } from "./interaction.entity.js";
import { User } from "../user/user.entity.js";
import * as deezer from "../deezer/deezer.client.js";
import { fetchEntityDisplay, type EntityDisplay } from "../deezer/entity-display.js";
import { HttpError } from "../shared/errors.js";
import type {
  EntityReview,
  EntityReviewsResult,
  LatestReview,
  ReviewedSong,
} from "./interaction.types.js";

export async function getEntityReviews(input: {
  type: MusicalEntityType;
  id: string;
  page: number;
  pageSize: number;
}): Promise<EntityReviewsResult> {
  const entity = await orm.em.findOne(MusicalEntity, {
    type: input.type,
    deezerId: Number(input.id),
  });

  if (!entity) {
    return { items: [], total: 0, totalPages: 0 };
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
    total,
    totalPages: Math.ceil(total / input.pageSize),
    items: interactions.map((interaction) => ({
      id: interaction.id,
      user: {
        id: interaction.user.id,
        nickname: interaction.user.nickname,
      },
      value: interaction.value,
      content: interaction.content!,
      createdAt: interaction.createdAt.toISOString(),
      updatedAt: interaction.updatedAt.toISOString(),
    })),
  };
}

export async function saveReview(input: {
  type: MusicalEntityType;
  id: string;
  userId: number;
  value: number;
  content?: string;
}): Promise<{ review: EntityReview; created: boolean }> {
  const em = orm.em;

  const user = await em.findOne(User, { id: input.userId });

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  let entity = await em.findOne(MusicalEntity, {
    type: input.type,
    deezerId: Number(input.id),
  });

  if (!entity) {
    entity = em.create(MusicalEntity, {
      type: input.type,
      deezerId: Number(input.id),
    });
  }

  const content = input.content?.trim() || null;

  let interaction = await em.findOne(Interaction, {
    user,
    musicalEntity: entity,
  });

  let created = false;

  if (interaction) {
    interaction.deletedAt = null as unknown as Date | undefined;
    interaction.value = input.value;
    interaction.content = content;
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
    created,
    review: {
      id: interaction.id,
      user: {
        id: user.id,
        nickname: user.nickname,
      },
      value: interaction.value,
      content: interaction.content ?? "",
      createdAt: interaction.createdAt.toISOString(),
      updatedAt: interaction.updatedAt.toISOString(),
    },
  };
}

async function refreshEntityStats(entity: MusicalEntity): Promise<void> {
  const interactions = await orm.em.find(Interaction, {
    musicalEntity: entity,
    deletedAt: null,
  });

  const withContent = interactions.filter(
    (interaction) =>
      interaction.content !== null && interaction.content !== undefined,
  );

  entity.ratingsCount = interactions.length;
  entity.reviewsCount = withContent.length;
  entity.averageRating =
    interactions.length === 0
      ? 0
      : interactions.reduce(
          (sum, interaction) => sum + interaction.value,
          0,
        ) / interactions.length;

  await orm.em.persist(entity).flush();
}

export async function getLatestReviews(limit: number): Promise<LatestReview[]> {
  const interactions = await orm.em.find(
    Interaction,
    { deletedAt: null, content: { $ne: null } },
    {
      populate: ["user", "musicalEntity"],
      orderBy: { createdAt: "DESC" },
      limit,
    },
  );

  const displays = new Map<string, Promise<EntityDisplay | null>>();

  return Promise.all(
    interactions.map(async (interaction) => {
      const entity = interaction.musicalEntity;
      const externalId = String(entity.deezerId);
      const key = `${entity.type}:${externalId}`;

      if (!displays.has(key)) {
        displays.set(
          key,
          fetchEntityDisplay(entity.type, externalId).catch(() => null),
        );
      }

      return {
        id: interaction.id,
        user: {
          id: interaction.user.id,
          nickname: interaction.user.nickname,
        },
        value: interaction.value,
        content: interaction.content!,
        createdAt: interaction.createdAt.toISOString(),
        updatedAt: interaction.updatedAt.toISOString(),
        entity: (await displays.get(key)) ?? {
          externalId,
          type: entity.type,
          title: null,
          cover: null,
          artist: null,
        },
      };
    }),
  );
}

export async function getLatestReviewedSongs(
  limit: number,
): Promise<ReviewedSong[]> {
  const interactions = await orm.em.find(
    Interaction,
    { deletedAt: null, musicalEntity: { type: "track" } },
    {
      populate: ["musicalEntity"],
      orderBy: { createdAt: "DESC" },
      limit: Math.max(limit * 5, 50),
    },
  );

  const latestByTrack = new Map<number, Interaction>();
  for (const interaction of interactions) {
    const deezerId = interaction.musicalEntity.deezerId;
    if (!latestByTrack.has(deezerId)) latestByTrack.set(deezerId, interaction);
  }

  const results = await Promise.allSettled(
    [...latestByTrack.values()].slice(0, limit).map(async (interaction) => {
      const entity = interaction.musicalEntity;
      const track = await deezer.getTrack(entity.deezerId);
      return {
        externalId: String(entity.deezerId),
        title: track.title,
        artist: track.artist?.name ?? null,
        artistId: track.artist?.id ?? null,
        album: track.album?.title ?? null,
        albumId: track.album?.id ?? null,
        duration: track.duration ?? null,
        cover: track.album?.cover_medium ?? null,
        averageRating: entity.averageRating || null,
        reviewsCount: entity.ratingsCount,
        reviewedAt: interaction.createdAt.toISOString(),
      };
    }),
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}
