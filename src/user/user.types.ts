export type UserSummary = {
  id: number;
  nickname: string;
};

export type UserProfile = UserSummary & {
  email: string;
  interactionsCount: number;
};

export type UserSearchResult = {
  results: UserSummary[];
  total: number;
};
