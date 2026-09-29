import type { Request, Response } from "express";
import {
  getUser as getUserService,
  searchUsers as searchUsersService,
} from "./user.service.js";
import type { UserIdParamsDTO, UserSearchQueryDTO } from "./user.dto.js";

export async function searchUsers(req: Request, res: Response) {
  const { query, limit, index } = req.query as unknown as UserSearchQueryDTO;
  res.json(await searchUsersService({ query, limit, index }));
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params as unknown as UserIdParamsDTO;
  res.json(await getUserService(id));
}
