export type ReviewedSong = {
  externalId: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  duration: number | null;
  cover: string | null;
  averageRating: number | null;
  reviewsCount: number;
  reviewedAt: string;
};