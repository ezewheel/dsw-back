export type EntityInteraction = {
  id: number;
  user: {
    id: number;
    nickname: string;
  };
  value: string;
  content: string | null;
  createdAt: string;
};

export type EntityInteractionsResult = {
  externalId: string;
  items: EntityInteraction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};