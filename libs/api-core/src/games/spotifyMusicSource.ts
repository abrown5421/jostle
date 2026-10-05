import { AppError } from '@inithium/api-utils';
import { GameSessionError } from '@inithium/game-session';
import type { IpodWarMusicSource } from '@inithium/game-session';
import { IntegrationRequestError, loadSpotifyPlaylistForUser } from '@inithium/integrations';

const SPOTIFY_REQUIREMENT = { kind: 'integration', provider: 'spotify' } as const;

// iPod War's songs, from the host's own Spotify playlist. Failures are translated into
// GameSessionErrors the host can act on, since this runs inside startGame.
export const spotifyMusicSource: IpodWarMusicSource = {
  name: 'Spotify',
  loadPlaylist: async (hostUserId, playlistId, signal) => {
    try {
      const { playlist, tracks } = await loadSpotifyPlaylistForUser(hostUserId, playlistId, { signal });
      return {
        playlist,
        tracks: tracks.map((track) => ({
          id: track.id,
          uri: track.uri,
          title: track.name,
          artists: track.artists,
          album: track.album,
          albumImageUrl: track.albumImageUrl,
          durationMs: track.durationMs,
        })),
      };
    } catch (error) {
      if (error instanceof IntegrationRequestError && (error.status === 403 || error.status === 404)) {
        throw new GameSessionError('GAME_SETUP_FAILED', "That playlist can't be read - pick one you own or collaborate on");
      }
      // Not connected (404) or the connection has lapsed (409) since the start was checked.
      if (error instanceof AppError && (error.statusCode === 404 || error.code === 'INTEGRATION_REAUTH_REQUIRED')) {
        throw new GameSessionError('REQUIREMENTS_NOT_MET', error.message, { requirement: SPOTIFY_REQUIREMENT });
      }
      throw error;
    }
  },
};
