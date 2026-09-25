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

export type AlbumSong = {
  externalId: string;
  title: string;
  duration: number;
  averageRating: number | null;
};

export type AlbumDetail = {
  externalId: string;
  title: string;
  cover_big: string;
  cover_medium: string;
  release_date: string;
  artist: {
    id: number;
    name: string;
  };
  averageRating: number | null;
  duration: number;
  songs: AlbumSong[];
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
    cover_big: string;
  };
  averageRating: number | null;
  ratingsCount: number;
};
