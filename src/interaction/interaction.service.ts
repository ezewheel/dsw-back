import type { FilterQuery } from "@mikro-orm/core";
import { orm } from "../shared/db/orm.js";
import {
  MusicalEntity,
  type MusicalEntityType,
} from "../musical-entity/musical-entity.entity.js";
import { Interaction } from "./interaction.entity.js";
import { User } from "../user/user.entity.js";
import * as deezer from "../deezer/deezer.client.js";
import {
  toEntitySummary,
  toUnavailableEntitySummary,
} from "../musical-entity/musical-entity.service.js";
import type { EntitySummary } from "../musical-entity/musical-entity.types.js";
import { HttpError } from "../shared/errors.js";
import type {
  EntityReview,
  Page,
  ReviewedSong,
  ReviewWithEntity,
} from "./interaction.types.js";

export async function getEntityReviews(input: {
  type: MusicalEntityType;
  id: string;
  page: number;
  pageSize: number;
}): Promise<Page<EntityReview>> {
  const entity = await orm.em.findOne(MusicalEntity, {
    type: input.type,
    deezerId: Number(input.id),
  });

  if (!entity) {
    return { items: [], total: 0, totalPages: 0 };
  }

  const [interactions, total] = await orm.em.findAndCount(
    Interaction,
    { musicalEntity: entity },
    {
      populate: ["user"],
      orderBy: { publishedAt: "DESC" },
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
    },
  );

  return {
    total,
    totalPages: Math.ceil(total / input.pageSize),
    items: interactions.map(toEntityReview),
  };
}

type OwnReviewInput = {
  type: MusicalEntityType;
  id: string;
  userId: number;
};

function findOwnInteraction(input: OwnReviewInput) {
  return orm.em.findOne(
    Interaction,
    {
      user: input.userId,
      musicalEntity: { type: input.type, deezerId: Number(input.id) },
    },
    { populate: ["user", "musicalEntity"] },
  );
}

export async function getOwnReview(
  input: OwnReviewInput,
): Promise<EntityReview | null> {
  const interaction = await findOwnInteraction(input);
  return interaction ? toEntityReview(interaction) : null;
}

export async function deleteReview(input: OwnReviewInput): Promise<void> {
  const interaction = await findOwnInteraction(input);

  if (!interaction) {
    throw new HttpError(404, "No tenés una reseña para este contenido");
  }

  await deleteReviews([interaction], interaction.user);
}

export async function deleteReviewById(input: {
  reviewId: string;
  moderator: User;
}): Promise<void> {
  const interaction = await orm.em.findOne(
    Interaction,
    { id: Number(input.reviewId) },
    { populate: ["user", "musicalEntity"] },
  );

  if (!interaction) {
    throw new HttpError(404, "Reseña no encontrada");
  }

  await deleteReviews([interaction], input.moderator);
}

export async function deleteReviews(
  interactions: Interaction[],
  deletedBy: User,
): Promise<void> {
  const deletedAt = new Date();
  for (const interaction of interactions) {
    interaction.deletedAt = deletedAt;
    interaction.deletedBy = deletedBy;
  }
  await orm.em.flush();

  const entities = new Set(
    interactions.map(({ musicalEntity }) => musicalEntity),
  );
  for (const entity of entities) {
    await refreshEntityStats(entity);
  }

  const authors = new Set(interactions.map(({ user }) => user));
  for (const author of authors) {
    await refreshUserStats(author);
  }
}

export async function saveReview(input: {
  type: MusicalEntityType;
  id: string;
  user: User;
  value: number;
  content?: string;
}): Promise<{ review: EntityReview; created: boolean }> {
  const em = orm.em;
  const { user } = input;

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
    interaction.value = input.value;
    interaction.content = content;
    interaction.publishedAt = new Date();
  } else {
    interaction = em.create(Interaction, {
      user,
      musicalEntity: entity,
      value: input.value,
      content,
    });
    created = true;
  }

  await em.flush();
  await refreshEntityStats(entity);
  if (created) await refreshUserStats(user);

  return { created, review: toEntityReview(interaction) };
}

function toEntityReview(interaction: Interaction): EntityReview {
  return {
    id: interaction.id,
    user: {
      id: interaction.user.id,
      nickname: interaction.user.nickname,
    },
    value: interaction.value,
    content: interaction.content ?? "",
    publishedAt: interaction.publishedAt.toISOString(),
  };
}

async function refreshEntityStats(entity: MusicalEntity): Promise<void> {
  const interactions = await orm.em.find(Interaction, {
    musicalEntity: entity,
  });

  entity.ratingsCount = interactions.length;
  entity.averageRating =
    interactions.length === 0
      ? 0
      : interactions.reduce(
          (sum, interaction) => sum + interaction.value,
          0,
        ) / interactions.length;

  await orm.em.persist(entity).flush();
}

async function refreshUserStats(user: User): Promise<void> {
  user.interactionsCount = await orm.em.count(Interaction, { user });
  await orm.em.flush();
}

type PageInput = {
  page: number;
  pageSize: number;
};

export function getLatestReviews(
  input: PageInput,
): Promise<Page<ReviewWithEntity>> {
  return findReviewsWithEntity({}, input);
}

export function getUserInteractions(
  input: PageInput & { userId: number },
): Promise<Page<ReviewWithEntity>> {
  return findReviewsWithEntity({ user: input.userId }, input);
}

async function findReviewsWithEntity(
  where: FilterQuery<Interaction>,
  { page, pageSize }: PageInput,
): Promise<Page<ReviewWithEntity>> {
  const [interactions, total] = await orm.em.findAndCount(Interaction, where, {
    populate: ["user", "musicalEntity"],
    orderBy: { publishedAt: "DESC" },
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const summaries = new Map<number, Promise<EntitySummary>>();
  const summarize = (entity: MusicalEntity) => {
    const cached = summaries.get(entity.id);
    if (cached) return cached;

    const summary = deezer.getEntity(entity.type, entity.deezerId).then(
      (item) => toEntitySummary(item, entity),
      () => toUnavailableEntitySummary(entity),
    );
    summaries.set(entity.id, summary);
    return summary;
  };

  const items = await Promise.all(
    interactions.map(async (interaction) => ({
      ...toEntityReview(interaction),
      entity: await summarize(interaction.musicalEntity),
    })),
  );

  return {
    items,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLatestReviewedSongs(
  limit: number,
): Promise<ReviewedSong[]> {
  const interactions = await orm.em.find(
    Interaction,
    { musicalEntity: { type: "track" } },
    {
      populate: ["musicalEntity"],
      orderBy: { publishedAt: "DESC" },
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
        artist: track.artist.name,
        artistId: track.artist.id,
        album: track.album.title,
        albumId: track.album.id,
        duration: track.duration,
        cover: track.album.cover_medium,
        averageRating: entity.averageRating || null,
        ratingsCount: entity.ratingsCount,
      };
    }),
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}
