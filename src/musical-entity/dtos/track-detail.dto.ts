export type TrackDetail = {
  externalId: string;
  title: string;
  duration: number;
  artist: {
    name: string;
  };
  album: {
    title: string;
    cover_big: string;
  };
};