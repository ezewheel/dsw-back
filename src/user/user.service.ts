import { orm } from "../shared/db/orm.js";
import { HttpError } from "../shared/errors.js";
import { User } from "./user.entity.js";
import type { UserSearchResult, UserSummary } from "./user.types.js";

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
  const user = await orm.em.findOne(User, { id: Number(id) });

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  return toUserSummary(user);
}

function toUserSummary(user: User): UserSummary {
  return { id: user.id, nickname: user.nickname };
}
