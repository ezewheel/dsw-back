export type ArtistTopTrack = {
  externalId: string;
  title: string;
  album: {
    id: number;
    title: string;
    cover_medium: string;
  };
  averageRating: number | null;
};

export type ArtistAlbum = {
  externalId: string;
  title: string;
  cover_big: string;
  release_date: string;
  averageRating: number | null;
};

export type ArtistDetail = {
  externalId: string;
  name: string;
  picture_big: string;
  averageRating: number | null;
  ratingsCount: number;
  topTracks: ArtistTopTrack[];
  albums: ArtistAlbum[];
};