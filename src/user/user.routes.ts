import { Router } from "express";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
  UserIdParamsDTO,
  UserSearchQueryDTO,
} from "./user.dto.js";
import {
  changePassword,
  getOwnInteractions,
  getProfile,
  getUser,
  searchUsers,
  updateProfile,
} from "./user.controller.js";
import { ReviewsPageQueryDTO } from "../interaction/interaction.dto.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";
import { requireAuth } from "../shared/middlewares/require-auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.put("/me", requireAuth, validateDTO(UpdateProfileDTO), updateProfile);
router.put(
  "/me/password",
  requireAuth,
  validateDTO(ChangePasswordDTO),
  changePassword,
);
router.get(
  "/me/interactions",
  requireAuth,
  validateDTO(ReviewsPageQueryDTO, "query"),
  getOwnInteractions,
);
router.get("/search", validateDTO(UserSearchQueryDTO, "query"), searchUsers);
router.get("/:id", validateDTO(UserIdParamsDTO, "params"), getUser);

export default router;
