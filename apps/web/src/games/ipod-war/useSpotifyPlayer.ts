import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLazyGetIntegrationAccessTokenQuery } from '@inithium/api-client';
import { getSpotifyPlayerState, retainSpotifyPlayer, subscribeToSpotifyPlayer } from './spotifyPlayer';
import type { SpotifyPlayerState } from './spotifyPlayer';

// Holds this browser's Spotify player open while mounted, and follows its state. Tokens come from
// the API (GET /api/integrations/spotify/token), which refreshes the host's token as needed.
export const useSpotifyPlayer = (): SpotifyPlayerState => {
  const [fetchToken] = useLazyGetIntegrationAccessTokenQuery();
  const getToken = useCallback(
    () =>
      fetchToken('spotify')
        .unwrap()
        .then(({ accessToken }) => accessToken),
    [fetchToken],
  );
  useEffect(() => retainSpotifyPlayer(getToken), [getToken]);
  return useSyncExternalStore(subscribeToSpotifyPlayer, getSpotifyPlayerState, getSpotifyPlayerState);
};
