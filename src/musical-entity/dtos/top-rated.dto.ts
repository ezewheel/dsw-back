export type TopRatedItem = {
  externalId: string;
  type: "track" | "album" | "artist";
  title: string | null;
  cover: string | null;
  artist: string | null;
  averageRating: number;
  reviewsCount: number;
};

export type TopRated = {
  artists: TopRatedItem[];
  albums: TopRatedItem[];
  tracks: TopRatedItem[];
};