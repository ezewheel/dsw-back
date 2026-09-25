import type { MusicalEntityType } from "./musical-entity.entity.js";

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

export type TopRatedItem = {
  externalId: string;
  type: MusicalEntityType;
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
