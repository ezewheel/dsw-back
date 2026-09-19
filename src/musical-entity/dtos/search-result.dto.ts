export type TrackSearchResult = {
  title: string;
  artist: {
    name: string;
  };
  album: {
    cover_medium: string;
  };
  averageRating: number | null;
};

export type AlbumSearchResult = {
  title: string;
  cover_medium: string;
  artist: {
    name: string;
  };
  averageRating: number | null;
};

export type ArtistSearchResult = {
  name: string;
  picture_medium: string;
  averageRating: number | null;
};

export type MusicalSearchResult =
  | { type: "track"; results: TrackSearchResult[] }
  | { type: "album"; results: AlbumSearchResult[] }
  | { type: "artist"; results: ArtistSearchResult[] };