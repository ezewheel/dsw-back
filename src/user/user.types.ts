export type UserSummary = {
  id: number;
  nickname: string;
};

export type UserSearchResult = {
  results: UserSummary[];
  total: number;
};
