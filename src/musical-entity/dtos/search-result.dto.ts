export type TrackSearchResult = {
  externalId: string;
  type: "track";
  title: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_medium: string;
  };
  averageRating: number | null;
  reviewsCount: number;
};

export type AlbumSearchResult = {
  externalId: string;
  type: "album";
  title: string;
  cover_medium: string;
  artist: {
    id: number;
    name: string;
  };
  averageRating: number | null;
  reviewsCount: number;
};

export type ArtistSearchResult = {
  externalId: string;
  type: "artist";
  name: string;
  picture_medium: string;
  averageRating: number | null;
  reviewsCount: number;
};

export type MusicalSearchResult = {
  results: (TrackSearchResult | AlbumSearchResult | ArtistSearchResult)[];
  total: number;
  hasMore: boolean;
};