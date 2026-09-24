import { Router } from "express";
import { login, me, register } from "./auth.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";
import { requireAuth } from "../shared/middlewares/require-auth.middleware.js";
import { LoginRequestDTO, RegisterRequestDTO } from "./auth.dto.js";

const router = Router();

router.post("/register", validateDTO(RegisterRequestDTO), register);
router.post("/login", validateDTO(LoginRequestDTO), login);
router.get("/me", requireAuth, me);

export default router;