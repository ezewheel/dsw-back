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
  reviewsCount: number;
  reviewedAt: string;
};