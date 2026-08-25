import { getAllPages } from '../client/index.js';
import type { SpotifyTrackSummary } from './types.js';

interface RawPlaylistTrack {
  id: string;
  uri: string;
  name: string;
  type: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
}

interface RawPlaylistTrackItem {
  is_local: boolean;
  track: RawPlaylistTrack | null;
}

const TRACK_FIELDS =
  'items(is_local,track(id,uri,name,type,artists(name),album(name,images),duration_ms)),next';

function buildPlaylistTracksUrl(playlistId: string): string {
  const encodedId = encodeURIComponent(playlistId);
  return `https://api.spotify.com/v1/playlists/${encodedId}/tracks?limit=100&fields=${encodeURIComponent(TRACK_FIELDS)}`;
}

export async function listPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyTrackSummary[]> {
  const items = await getAllPages<RawPlaylistTrackItem>(
    accessToken,
    buildPlaylistTracksUrl(playlistId),
  );

  return items
    .filter((item) => !item.is_local && item.track !== null && item.track.type === 'track')
    .map((item) => {
      const track = item.track as RawPlaylistTrack;
      return {
        uri: track.uri,
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
        albumName: track.album.name,
        albumImageUrl: track.album.images?.[0]?.url ?? null,
        durationMs: track.duration_ms,
      };
    });
}
