import bcrypt from "bcrypt";
import { orm } from "../shared/db/orm.js";
import { HttpError } from "../shared/errors.js";
import { hashPassword } from "../auth/auth.service.js";
import { User } from "./user.entity.js";
import type {
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

export async function getUser(id: string): Promise<UserSummary> {
  return toUserSummary(await findUser(Number(id)));
}

export async function getProfile(userId: number): Promise<UserProfile> {
  return toUserProfile(await findUser(userId));
}

export async function updateProfile(
  userId: number,
  input: { email: string; nickname: string },
): Promise<UserProfile> {
  const user = await findUser(userId);
  const emailOwner = await orm.em.findOne(User, {
    email: input.email,
    id: { $ne: userId },
  });

  if (emailOwner) {
    throw new HttpError(409, "El email ya está registrado");
  }

  user.email = input.email;
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
  };
}
