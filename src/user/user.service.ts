import bcrypt from "bcrypt";
import { orm } from "../shared/db/orm.js";
import { HttpError } from "../shared/errors.js";
import { hashPassword } from "../auth/auth.service.js";
import { Interaction } from "../interaction/interaction.entity.js";
import {
  deleteReviews,
  getUserInteractions,
} from "../interaction/interaction.service.js";
import type {
  ReviewsWithEntityResult,
} from "../interaction/interaction.types.js";
import { User } from "./user.entity.js";
import type {
  UserDetail,
  UserProfile,
  UserSearchResult,
  UserSummary,
} from "./user.types.js";

const LIKE_WILDCARDS = /[\\%_]/g;

export async function searchUsers(input: {
  query: string;
  limit: number;
  index: number;
}): Promise<UserSearchResult> {
  const pattern = `%${input.query.trim().replace(LIKE_WILDCARDS, "\\$&")}%`;

  const [users, total] = await orm.em.findAndCount(
    User,
    { nickname: { $like: pattern } },
    {
      orderBy: { nickname: "ASC" },
      limit: input.limit,
      offset: input.index,
    },
  );

  return { results: users.map(toUserSummary), total };
}

export async function getUser(id: string): Promise<UserDetail> {
  const user = await findUser(Number(id));

  return {
    ...toUserSummary(user),
    role: user.role,
    bannedAt: user.bannedAt?.toISOString() ?? null,
  };
}

export async function getUserReviews(input: {
  id: string;
  page: number;
  pageSize: number;
}): Promise<ReviewsWithEntityResult> {
  const user = await findUser(Number(input.id));
  return getUserInteractions({ ...input, userId: user.id });
}

export async function banUser(input: {
  id: string;
  moderator: User;
}): Promise<void> {
  const user = await findUser(Number(input.id));

  if (user.role === "moderator") {
    throw new HttpError(403, "No se puede banear a un moderador");
  }

  if (user.bannedAt) {
    throw new HttpError(409, "El usuario ya está baneado");
  }

  user.bannedAt = new Date();
  user.bannedBy = input.moderator;

  const reviews = await orm.em.find(
    Interaction,
    { user },
    { populate: ["musicalEntity"] },
  );
  await deleteReviews(reviews, input.moderator);
}

export async function getProfile(userId: number): Promise<UserProfile> {
  return toUserProfile(await findUser(userId));
}

export async function updateProfile(
  userId: number,
  input: { nickname: string },
): Promise<UserProfile> {
  const user = await findUser(userId);
  user.nickname = input.nickname;
  await orm.em.flush();

  return toUserProfile(user);
}

export async function changePassword(
  userId: number,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  const user = await findUser(userId);

  if (!(await bcrypt.compare(input.currentPassword, user.password))) {
    throw new HttpError(400, "La contraseña actual es incorrecta");
  }

  user.password = await hashPassword(input.newPassword);
  await orm.em.flush();
}

async function findUser(id: number): Promise<User> {
  const user = await orm.em.findOne(User, { id });

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  return user;
}

function toUserSummary(user: User): UserSummary {
  return { id: user.id, nickname: user.nickname };
}

function toUserProfile(user: User): UserProfile {
  return {
    ...toUserSummary(user),
    email: user.email,
    interactionsCount: user.interactionsCount,
    createdAt: user.createdAt.toISOString(),
  };
}
