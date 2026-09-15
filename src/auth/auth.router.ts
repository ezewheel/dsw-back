import { Router } from "express";
import { login, register } from "./auth.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";
import { LoginRequestDTO } from "./dtos/login-request.dto.js";
import { RegisterRequestDTO } from "./dtos/register-request.dto.js";

const router = Router();

router.post("/register", validateDTO(RegisterRequestDTO), register);
router.post("/login", validateDTO(LoginRequestDTO), login);

export default router;