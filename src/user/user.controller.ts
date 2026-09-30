import type { Request, Response } from "express";
import {
  banUser as banUserService,
  changePassword as changePasswordService,
  deleteAccount as deleteAccountService,
  getProfile as getProfileService,
  getUser as getUserService,
  getUserReviews as getUserReviewsService,
  searchUsers as searchUsersService,
  updateProfile as updateProfileService,
} from "./user.service.js";
import { getUserInteractions } from "../interaction/interaction.service.js";
import type { ReviewsPageQueryDTO } from "../interaction/interaction.dto.js";
import type {
  ChangePasswordDTO,
  DeleteAccountDTO,
  UpdateProfileDTO,
  UserIdParamsDTO,
  UserSearchQueryDTO,
} from "./user.dto.js";

export async function searchUsers(req: Request, res: Response) {
  const { query, limit, index } = req.query as unknown as UserSearchQueryDTO;
  res.json(await searchUsersService({ query, limit, index }));
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params as unknown as UserIdParamsDTO;
  res.json(await getUserService(id));
}

export async function getProfile(req: Request, res: Response) {
  res.json(getProfileService(req.user!));
}

export async function updateProfile(req: Request, res: Response) {
  const input = req.body as UpdateProfileDTO;
  res.json(await updateProfileService(req.user!, input));
}

export async function changePassword(req: Request, res: Response) {
  await changePasswordService(req.user!, req.body as ChangePasswordDTO);
  res.status(204).end();
}

export async function deleteAccount(req: Request, res: Response) {
  await deleteAccountService(req.user!, req.body as DeleteAccountDTO);
  res.status(204).end();
}

export async function getOwnInteractions(req: Request, res: Response) {
  const { page, pageSize } = req.query as unknown as ReviewsPageQueryDTO;
  res.json(await getUserInteractions({ userId: req.user!.id, page, pageSize }));
}

export async function getUserReviews(req: Request, res: Response) {
  const { id } = req.params as unknown as UserIdParamsDTO;
  const { page, pageSize } = req.query as unknown as ReviewsPageQueryDTO;
  res.json(await getUserReviewsService({ id, page, pageSize }));
}

export async function banUser(req: Request, res: Response) {
  const { id } = req.params as unknown as UserIdParamsDTO;
  await banUserService({ id, moderator: req.user! });
  res.status(204).end();
}
