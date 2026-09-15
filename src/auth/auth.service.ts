import { orm } from "../shared/db/orm.js";
import { User } from "../user/user.entity.js";
import bcrypt from "bcrypt";

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; error: "INVALID_CREDENTIALS" };

export type RegisterResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: "EMAIL_TAKEN" };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const user = await orm.em.findOne(User, { email: input.email });

  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  return { ok: true, token: createAuthToken(user) };
}

export async function register(input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<RegisterResult> {
  const existing = await orm.em.findOne(User, { email: input.email });

  if (existing) {
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  const user = new User();
  user.email = input.email;
  user.password = await bcrypt.hash(input.password, 10);
  user.nickname = input.nickname;

  await orm.em.persist(user).flush();

  return {
    ok: true,
    user: { id: user.id!, email: user.email, nickname: user.nickname },
  };
}

function createAuthToken(_user: User): string {
  return "ok";
}