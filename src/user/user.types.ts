import type { UserRole } from "./user.entity.js";

export type UserSummary = {
  id: number;
  nickname: string;
};

export type UserDetail = UserSummary & {
  role: UserRole;
  interactionsCount: number;
  createdAt: string;
};

export type UserProfile = UserSummary & {
  email: string;
  interactionsCount: number;
  createdAt: string;
};

export type UserSearchResult = {
  results: UserSummary[];
  total: number;
};
