import type { MusicalEntityType } from "./musical-entity.entity.js";

export type EntitySummary = {
  externalId: string;
  type: MusicalEntityType;
  title: string | null;
  cover: string | null;
  artist: string | null;
  averageRating: number | null;
  ratingsCount: number;
};

export type MusicalSearchResult = {
  results: EntitySummary[];
  total: number;
};

export type TopRated = {
  artists: EntitySummary[];
  albums: EntitySummary[];
  tracks: EntitySummary[];
};

export type ArtistTopTrack = {
  externalId: string;
  title: string;
  album: {
    id: number;
    title: string;
    cover: string;
  };
  averageRating: number | null;
};

export type ArtistAlbum = {
  externalId: string;
  title: string;
  cover: string;
  releaseDate: string;
  averageRating: number | null;
};

export type ArtistDetail = {
  externalId: string;
  name: string;
  cover: string;
  averageRating: number | null;
  ratingsCount: number;
  topTracks: ArtistTopTrack[];
  albums: ArtistAlbum[];
};

export type AlbumTrack = {
  externalId: string;
  title: string;
  duration: number;
  averageRating: number | null;
};

export type AlbumDetail = {
  externalId: string;
  title: string;
  cover: string;
  releaseDate: string;
  artist: {
    id: number;
    name: string;
  };
  averageRating: number | null;
  duration: number;
  tracks: AlbumTrack[];
};

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
    cover: string;
  };
  averageRating: number | null;
  ratingsCount: number;
};
