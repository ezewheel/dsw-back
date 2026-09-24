import type { Request, Response } from "express";
import {
  getMe,
  login as loginService,
  register as registerService,
} from "./auth.service.js";
import type { LoginRequestDTO } from "./dtos/login-request.dto.js";
import type { RegisterRequestDTO } from "./dtos/register-request.dto.js";

export async function login(req: Request, res: Response) {
  res.json(await loginService(req.body as LoginRequestDTO));
}

export async function register(req: Request, res: Response) {
  res.status(201).json(await registerService(req.body as RegisterRequestDTO));
}

export async function me(req: Request, res: Response) {
  res.json(await getMe(req.user!.sub));
}
