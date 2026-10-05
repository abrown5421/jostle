import { withIntegrationAccessToken } from '../../service/integration.service';
import { fetchSpotifyPlaylistTracks, getSpotifyPlaylistSummary } from './spotify.api';
import type { SpotifyPlaylistSummary, SpotifyTrack } from './spotify.api';

export interface SpotifyPlaylistWithTracks {
  readonly playlist: SpotifyPlaylistSummary;
  readonly tracks: readonly SpotifyTrack[];
}

// A user's playlist and every playable song in it, on their own (auto-refreshed) token - what iPod
// War draws its song bank from.
export const loadSpotifyPlaylistForUser = (
  userId: string,
  playlistId: string,
  options: { signal?: AbortSignal } = {},
): Promise<SpotifyPlaylistWithTracks> =>
  withIntegrationAccessToken(userId, 'spotify', async (accessToken) => {
    const [playlist, tracks] = await Promise.all([
      getSpotifyPlaylistSummary(accessToken, playlistId, options),
      fetchSpotifyPlaylistTracks(accessToken, playlistId, options),
    ]);
    return { playlist, tracks };
  });
