export type TrackDetail = {
  externalId: string;
  title: string;
  duration: number;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_big: string;
  };
  averageRating: number | null;
  ratingsCount: number;
};