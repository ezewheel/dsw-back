import { orm } from "../shared/db/orm.js";
import { User } from "../user/user.entity.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../shared/config.js";
import { HttpError } from "../shared/errors.js";

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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const user = await orm.em.findOne(User, { email: input.email });

  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    throw new HttpError(401, "Email o contraseña incorrectos");
  }

  return { token: createAuthToken(user), user: toAuthUser(user) };
}

export async function register(input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<AuthResponse> {
  const existing = await orm.em.findOne(User, { email: input.email });

  if (existing) {
    throw new HttpError(409, "El email ya está registrado");
  }

  const user = new User();
  user.email = input.email;
  user.password = await bcrypt.hash(input.password, 10);
  user.nickname = input.nickname;

  await orm.em.persist(user).flush();

  return { token: createAuthToken(user), user: toAuthUser(user) };
}

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email, nickname: user.nickname };
}

function createAuthToken(user: User): string {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as unknown as AuthTokenPayload;
}

export async function getMe(userId: number): Promise<AuthUser> {
  const user = await orm.em.findOne(User, { id: userId });

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  return toAuthUser(user);
}