import * as deezer from "./deezer.client.js";
import type { MusicalEntityType } from "../musical-entity/musical-entity.entity.js";

export type EntityDisplay = {
  externalId: string;
  type: MusicalEntityType;
  title: string | null;
  cover: string | null;
  artist: string | null;
};

export async function fetchEntityDisplay(
  type: MusicalEntityType,
  externalId: string,
): Promise<EntityDisplay> {
  if (type === "artist") {
    const artist = await deezer.getArtist(externalId);
    return {
      externalId,
      type,
      title: artist.name,
      cover: artist.picture_big,
      artist: null,
    };
  }

  if (type === "album") {
    const album = await deezer.getAlbum(externalId);
    return {
      externalId,
      type,
      title: album.title,
      cover: album.cover_big,
      artist: album.artist?.name ?? null,
    };
  }

  const track = await deezer.getTrack(externalId);
  return {
    externalId,
    type,
    title: track.title,
    cover: track.album?.cover_medium ?? null,
    artist: track.artist?.name ?? null,
  };
}