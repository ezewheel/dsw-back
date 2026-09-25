import type { EntitySummary } from "../musical-entity/musical-entity.types.js";

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
  items: EntityReview[];
  total: number;
  totalPages: number;
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
  entity: EntitySummary;
};

export type ReviewedSong = {
  externalId: string;
  title: string | null;
  artist: string | null;
  artistId: number | null;
  album: string | null;
  albumId: number | null;
  duration: number | null;
  cover: string | null;
  averageRating: number | null;
  ratingsCount: number;
  reviewedAt: string;
};
