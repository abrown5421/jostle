import { getAllPages } from '../client/index.js';
import type { SpotifyPlaylistSummary } from './types.js';

interface RawSpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[] | null;
  owner: { id: string };
  tracks: { total: number };
}

const USER_PLAYLISTS_ENDPOINT = 'https://api.spotify.com/v1/me/playlists?limit=50';

export async function listUserPlaylists(accessToken: string): Promise<SpotifyPlaylistSummary[]> {
  const playlists = await getAllPages<RawSpotifyPlaylist | null>(
    accessToken,
    USER_PLAYLISTS_ENDPOINT,
  );

  return playlists
    .filter((playlist): playlist is RawSpotifyPlaylist => playlist !== null)
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      imageUrl: playlist.images?.[0]?.url ?? null,
      ownerId: playlist.owner.id,
      trackCount: playlist.tracks.total,
    }));
}
