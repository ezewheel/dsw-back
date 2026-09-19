export type TrackSearchResult = {
  externalId: string;
  type: "track";
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
  externalId: string;
  type: "album";
  title: string;
  cover_medium: string;
  artist: {
    name: string;
  };
  averageRating: number | null;
};

export type ArtistSearchResult = {
  externalId: string;
  type: "artist";
  name: string;
  picture_medium: string;
  averageRating: number | null;
};

export type MusicalSearchResult = {
  results: (TrackSearchResult | AlbumSearchResult | ArtistSearchResult)[];
};