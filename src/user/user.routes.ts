import { Router } from "express";
import { UserIdParamsDTO, UserSearchQueryDTO } from "./user.dto.js";
import { getUser, searchUsers } from "./user.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";

const router = Router();

router.get("/search", validateDTO(UserSearchQueryDTO, "query"), searchUsers);
router.get("/:id", validateDTO(UserIdParamsDTO, "params"), getUser);

export default router;
