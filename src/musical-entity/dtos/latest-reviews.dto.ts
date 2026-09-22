export type LatestReviewEntity = {
  externalId: string;
  type: "track" | "album" | "artist";
  title: string | null;
  cover: string | null;
  artist: string | null;
};

export type LatestReview = {
  id: number;
  user: {
    id: number;
    nickname: string;
  };
  value: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  entity: LatestReviewEntity;
};