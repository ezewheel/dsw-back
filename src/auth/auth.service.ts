import { orm } from "../shared/db/orm.js";
import { User } from "../user/user.entity.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const jwtSecretEnv = process.env.JWT_SECRET;

if (!jwtSecretEnv) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

const jwtSecret: string = jwtSecretEnv;

const JWT_EXPIRES_IN = "7d";

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

export interface AuthTokenPayload {
  sub: number;
  iat: number;
  exp: number;
}

interface AuthSuccess {
  ok: true;
  token: string;
  user: AuthUser;
}

export type LoginResult =
  | AuthSuccess
  | { ok: false; error: "INVALID_CREDENTIALS" };

export type RegisterResult =
  | AuthSuccess
  | { ok: false; error: "EMAIL_TAKEN" };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const user = await orm.em.findOne(User, { email: input.email });

  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  return { ok: true, token: createAuthToken(user), user: toAuthUser(user) };
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

  return { ok: true, token: createAuthToken(user), user: toAuthUser(user) };
}

function toAuthUser(user: User): AuthUser {
  return { id: user.id!, email: user.email, nickname: user.nickname };
}

function createAuthToken(user: User): string {
  return jwt.sign({ sub: user.id! }, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, jwtSecret) as unknown as AuthTokenPayload;
}