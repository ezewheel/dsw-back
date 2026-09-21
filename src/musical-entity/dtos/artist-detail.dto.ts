export type ArtistTopTrack = {
  externalId: string;
  title: string;
  album: {
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
};

export type ArtistDetail = {
  externalId: string;
  name: string;
  picture_big: string;
  topTracks: ArtistTopTrack[];
  albums: ArtistAlbum[];
};