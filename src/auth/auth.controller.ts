import type { Request, Response } from "express";
import { login as loginService, register as registerService } from "./auth.service.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await loginService({ email, password });

  if (!result.ok) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }

  return res.status(200).json({ token: result.token });
}

export async function register(req: Request, res: Response) {
  const { email, password, nickname } = req.body;
  const result = await registerService({ email, password, nickname });

  if (!result.ok) {
    return res.status(409).json({ message: "El email ya está registrado" });
  }

  return res.status(201).json({ user: result.user });
}