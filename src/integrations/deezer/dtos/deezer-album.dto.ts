export interface DeezerAlbumDTO {
  id: number;
  title: string;
  cover_big: string;
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
