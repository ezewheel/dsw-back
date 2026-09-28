import { orm } from "../shared/db/orm.js";
import { MusicalEntity, type MusicalEntityType } from "./musical-entity.entity.js";
import * as deezer from "../deezer/deezer.client.js";
import type { DeezerArtistDTO, DeezerEntity } from "../deezer/deezer.types.js";
import type {
  AlbumDetail,
  ArtistDetail,
  EntitySummary,
  MusicalSearchResult,
  TopRated,
  TrackDetail,
} from "./musical-entity.types.js";

export async function getTopRated(): Promise<TopRated> {
  const [artists, albums, tracks] = await Promise.all([
    getTopRatedByType("artist"),
    getTopRatedByType("album"),
    getTopRatedByType("track"),
  ]);

  return { artists, albums, tracks };
}

async function getTopRatedByType(
  type: MusicalEntityType,
): Promise<EntitySummary[]> {
  const entities = await orm.em.find(
    MusicalEntity,
    { type, averageRating: { $gt: 0 } },
    {
      orderBy: { averageRating: "DESC", ratingsCount: "DESC" },
      limit: 5,
    },
  );

  const results = await Promise.allSettled(
    entities.map(async (entity) =>
      toEntitySummary(await deezer.getEntity(type, entity.deezerId), entity),
    ),
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

export async function getArtistDetail(
  externalId: string,
): Promise<ArtistDetail> {
  const [artist, topTracks, albums] = await Promise.all([
    deezer.getArtist(externalId),
    deezer.getArtistTopTracks(externalId),
    deezer.getArtistAlbums(externalId),
  ]);

  const [trackEntities, albumEntities, artistRating] = await Promise.all([
    findEntities("track", topTracks),
    findEntities("album", albums),
    findEntityRating("artist", artist.id),
  ]);

  const topRatedTracks = topTracks
    .map((track) => ({
      externalId: String(track.id),
      title: track.title,
      album: {
        id: track.album.id,
        title: track.album.title,
        cover: track.album.cover_medium,
      },
      averageRating: toRating(trackEntities.get(track.id)).averageRating,
    }))
    .filter((track) => track.averageRating !== null)
    .sort((a, b) => b.averageRating! - a.averageRating!)
    .slice(0, 5);

  return {
    externalId: String(artist.id),
    name: artist.name,
    cover: artist.picture_big,
    ...artistRating,
    topTracks: topRatedTracks,
    albums: albums.map((album) => ({
      externalId: String(album.id),
      title: album.title,
      cover: album.cover_big,
      releaseDate: album.release_date,
      averageRating: toRating(albumEntities.get(album.id)).averageRating,
    })),
  };
}

export async function getAlbumDetail(externalId: string): Promise<AlbumDetail> {
  const album = await deezer.getAlbum(externalId);
  const deezerTracks = album.tracks?.data ?? [];

  const [trackEntities, { averageRating }] = await Promise.all([
    findEntities("track", deezerTracks),
    findEntityRating("album", album.id),
  ]);

  const tracks = deezerTracks.map((track) => ({
    externalId: String(track.id),
    title: track.title,
    duration: track.duration,
    averageRating: toRating(trackEntities.get(track.id)).averageRating,
  }));

  return {
    externalId: String(album.id),
    title: album.title,
    cover: album.cover_big,
    releaseDate: album.release_date,
    artist: { id: album.artist.id, name: album.artist.name },
    averageRating,
    duration: tracks.reduce((acc, track) => acc + track.duration, 0),
    tracks,
  };
}

export async function getTrackDetail(externalId: string): Promise<TrackDetail> {
  const track = await deezer.getTrack(externalId);
  const rating = await findEntityRating("track", track.id);

  return {
    externalId: String(track.id),
    title: track.title,
    duration: track.duration,
    artist: { id: track.artist.id, name: track.artist.name },
    album: {
      id: track.album.id,
      title: track.album.title,
      cover: track.album.cover_big ?? track.album.cover_medium,
    },
    ...rating,
  };
}

export async function search(input: {
  query: string;
  type: MusicalEntityType;
  limit: number;
  index: number;
}): Promise<MusicalSearchResult> {
  const { data, total } = await deezer.search(input);

  if (input.type === "artist") {
    (data as DeezerArtistDTO[]).sort((a, b) => b.nb_fan - a.nb_fan);
  }

  const entities = await findEntities(input.type, data);
  return {
    results: data.map((item) => toEntitySummary(item, entities.get(item.id))),
    total,
  };
}

export function toEntitySummary(
  item: DeezerEntity,
  entity: MusicalEntity | undefined,
): EntitySummary {
  return {
    externalId: String(item.id),
    type: item.type,
    ...describe(item),
    ...toRating(entity),
  };
}

export function toUnavailableEntitySummary(
  entity: MusicalEntity,
): EntitySummary {
  return {
    externalId: String(entity.deezerId),
    type: entity.type,
    title: null,
    cover: null,
    artist: null,
    ...toRating(entity),
  };
}

function describe(item: DeezerEntity) {
  switch (item.type) {
    case "artist":
      return { title: item.name, cover: item.picture_medium, artist: null };
    case "album":
      return {
        title: item.title,
        cover: item.cover_medium,
        artist: item.artist.name,
      };
    case "track":
      return {
        title: item.title,
        cover: item.album.cover_medium,
        artist: item.artist.name,
      };
  }
}

function toRating(entity: MusicalEntity | null | undefined) {
  return {
    averageRating: entity?.averageRating || null,
    ratingsCount: entity?.ratingsCount ?? 0,
  };
}

async function findEntityRating(type: MusicalEntityType, deezerId: number) {
  return toRating(await orm.em.findOne(MusicalEntity, { type, deezerId }));
}

async function findEntities(
  type: MusicalEntityType,
  deezerItems: { id: number }[],
): Promise<Map<number, MusicalEntity>> {
  const entities = await orm.em.find(MusicalEntity, {
    type,
    deezerId: { $in: deezerItems.map((item) => item.id) },
  });
  return new Map(entities.map((entity) => [entity.deezerId, entity]));
}
