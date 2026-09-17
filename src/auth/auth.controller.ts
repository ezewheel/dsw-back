import type { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import {
  getMe,
  login as loginService,
  register as registerService,
} from "./auth.service.js";
import { LoginResponseDTO } from "./dtos/login-response.dto.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await loginService({ email, password });

  if (!result.ok) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }

  return res.status(200).json(plainToInstance(LoginResponseDTO, result));
}

export async function register(req: Request, res: Response) {
  const { email, password, nickname } = req.body;
  const result = await registerService({ email, password, nickname });

  if (!result.ok) {
    return res.status(409).json({ message: "El email ya está registrado" });
  }

  return res.status(201).json(plainToInstance(LoginResponseDTO, result));
}

export async function me(req: Request, res: Response) {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const user = await getMe(userId);

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  return res.status(200).json(user);
}