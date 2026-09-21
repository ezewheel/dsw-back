export interface DeezerAlbumDTO {
  id: number;
  title: string;
  cover_big: string;
  cover_medium: string;
  release_date: string;
  artist: {
    id: number;
    name: string;
  };
  tracks?: {
    data: {
      id: number;
      title: string;
      duration: number;
    }[];
  };
}

export interface DeezerTrackDTO {
  id: number;
  title: string;
  duration: number;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_medium: string;
    cover_big?: string;
  };
}

export interface DeezerArtistDTO {
  id: number;
  name: string;
  picture_medium: string;
  picture_big: string;
  nb_fan: number;
}

export interface DeezerAlbumListItemDTO {
  id: number;
  title: string;
  cover_big: string;
  release_date: string;
}
