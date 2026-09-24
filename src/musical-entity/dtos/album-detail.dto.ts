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