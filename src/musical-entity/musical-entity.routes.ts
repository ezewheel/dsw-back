import { Router } from "express";
import { SearchRequestDTO } from "./dtos/search-request.dto.js";
import { ArtistParamsDTO } from "./dtos/artist-params.dto.js";
import { EntityInteractionsParamsDTO } from "./dtos/entity-interactions-params.dto.js";
import { EntityInteractionsQueryDTO } from "./dtos/entity-interactions-query.dto.js";
import {
  search,
  getArtistDetail,
  getEntityInteractions,
} from "./musical-entity.controller.js";
import { validateDTO } from "../shared/middlewares/validate-dto.middleware.js";

const router = Router();

router.get("/search", validateDTO(SearchRequestDTO, "query"), search);
router.get(
  "/artist/:id",
  validateDTO(ArtistParamsDTO, "params"),
  getArtistDetail,
);
router.get(
  "/:type/:id/interactions",
  validateDTO(EntityInteractionsParamsDTO, "params"),
  validateDTO(EntityInteractionsQueryDTO, "query"),
  getEntityInteractions,
);

export default router;
