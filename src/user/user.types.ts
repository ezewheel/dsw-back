import type { UserRole } from "./user.entity.js";

export type UserSummary = {
  id: number;
  nickname: string;
};

export type UserDetail = UserSummary & {
  role: UserRole;
  bannedAt: string | null;
};

export type UserProfile = UserSummary & {
  email: string;
  interactionsCount: number;
};

export type UserSearchResult = {
  results: UserSummary[];
  total: number;
};
