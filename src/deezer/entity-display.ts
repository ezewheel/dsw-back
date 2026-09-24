import { DeezerClient } from "./deezer.client.js";

const deezerClient = new DeezerClient();

export type EntityDisplay = {
  externalId: string;
  type: "track" | "album" | "artist";
  title: string | null;
  cover: string | null;
  artist: string | null;
};

export async function fetchEntityDisplay(
  type: "track" | "album" | "artist",
  externalId: string,
): Promise<EntityDisplay> {
  if (type === "artist") {
    const artist = await deezerClient.getArtist(externalId);
    return {
      externalId,
      type,
      title: artist.name,
      cover: artist.picture_big,
      artist: null,
    };
  }

  if (type === "album") {
    const album = await deezerClient.getAlbum(externalId);
    return {
      externalId,
      type,
      title: album.title,
      cover: album.cover_big,
      artist: album.artist?.name ?? null,
    };
  }

  const track = await deezerClient.getTrack(externalId);
  return {
    externalId,
    type,
    title: track.title,
    cover: track.album?.cover_medium ?? null,
    artist: track.artist?.name ?? null,
  };
}