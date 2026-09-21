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