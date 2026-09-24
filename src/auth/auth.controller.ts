import type { Request, Response } from "express";
import {
  getMe,
  login as loginService,
  register as registerService,
} from "./auth.service.js";
import type { LoginRequestDTO, RegisterRequestDTO } from "./auth.dto.js";

export async function login(req: Request, res: Response) {
  res.json(await loginService(req.body as LoginRequestDTO));
}

export async function register(req: Request, res: Response) {
  res.status(201).json(await registerService(req.body as RegisterRequestDTO));
}

export async function me(req: Request, res: Response) {
  res.json(await getMe(req.user!.sub));
}
