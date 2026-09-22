export type EntityReview = {
  id: number;
  user: {
    id: number;
    nickname: string;
  };
  value: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type EntityReviewsResult = {
  externalId: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: EntityReview[];
};