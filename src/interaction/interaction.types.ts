import type { EntitySummary } from "../musical-entity/musical-entity.types.js";
import type { UserSummary } from "../user/user.types.js";

export type EntityReview = {
  id: number;
  user: UserSummary;
  value: number;
  content: string;
  publishedAt: string;
};

export type ReviewWithEntity = EntityReview & { entity: EntitySummary };

export type Page<T> = {
  items: T[];
  total: number;
  totalPages: number;
};

export type ReviewedSong = {
  externalId: string;
  title: string;
  artist: string;
  artistId: number;
  album: string;
  albumId: number;
  duration: number;
  cover: string;
  averageRating: number | null;
  ratingsCount: number;
  reviewedAt: string;
};
