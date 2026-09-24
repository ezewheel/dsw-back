import { orm } from "../shared/db/orm.js";
import { MusicalEntity } from "../musical-entity/musical-entity.entity.js";
import { Interaction } from "./interaction.entity.js";
import { User } from "../user/user.entity.js";
import * as deezer from "../deezer/deezer.client.js";
import { fetchEntityDisplay } from "../deezer/entity-display.js";
import { HttpError } from "../shared/errors.js";
import type {
  EntityReview,
  EntityReviewsResult as EntityReviewsPaginated,
  LatestReview,
  ReviewedSong,
} from "./interaction.types.js";

export async function getEntityReviews(input: {
  type: "track" | "album" | "artist";
  id: string;
  page: number;
  pageSize: number;
}): Promise<EntityReviewsPaginated> {
  const entity = await orm.em.findOne(MusicalEntity, {
    type: input.type,
    deezerId: Number(input.id),
  });

  if (!entity) {
    return {
      externalId: input.id,
      page: input.page,
      pageSize: input.pageSize,
      total: 0,
      totalPages: 0,
      items: [],
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
  };
}

export async function saveReview(input: {
  type: "track" | "album" | "artist";
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
      reviewsCount: 0,
      ratingsCount: 0,
      averageRating: 0,
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
          (sum, interaction) => sum + Number(interaction.value),
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
        entityInfo.set(
          key,
          await fetchEntityDisplay(entity.type, String(entity.deezerId)),
        );
      } catch {
        entityInfo.set(key, null);
      }
    }),
  );

  return interactions.map((interaction) => {
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
      entity: info ?? {
        externalId: String(entity.deezerId),
        type: entity.type,
        title: null,
        cover: null,
        artist: null,
      },
    };
  });
}

export async function getLatestReviewedSongs(
  limit: number,
): Promise<ReviewedSong[]> {
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
      const track = await deezer.getTrack(id);
      songs.push({
        externalId: id,
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
      });
    } catch {}

    if (songs.length === limit) break;
  }

  return songs;
}
