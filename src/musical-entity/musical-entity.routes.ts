import { Router } from "express";
import { SearchRequestDTO } from "./dtos/search-request.dto.js";
import { search } from "./musical-entity.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";

const router = Router();

router.get("/search", validateDTO(SearchRequestDTO, "query"), search);

export default router;
