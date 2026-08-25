import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSpotifyWebPlaybackSdk } from './load-spotify-sdk.js';
import './spotify-sdk-types.js';
import type { PlaybackEngine, PlaybackEngineStatus } from './types.js';

const PLAY_ENDPOINT = 'https://api.spotify.com/v1/me/player/play';
const PAUSE_ENDPOINT = 'https://api.spotify.com/v1/me/player/pause';

export interface UsePlaybackEngineOptions {
  readonly fetchAccessToken: () => Promise<string>;
}

export function usePlaybackEngine({ fetchAccessToken }: UsePlaybackEngineOptions): PlaybackEngine {
  const [status, setStatus] = useState<PlaybackEngineStatus>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const fetchAccessTokenRef = useRef(fetchAccessToken);
  fetchAccessTokenRef.current = fetchAccessToken;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    loadSpotifyWebPlaybackSdk().then(() => {
      if (cancelled || !window.Spotify) return;

      const player = new window.Spotify.Player({
        name: 'Jostle Ipod War',
        getOAuthToken: (callback) => {
          fetchAccessTokenRef.current().then(callback);
        },
        volume: 1,
      });

      player.addListener('ready', ({ device_id }) => {
        deviceIdRef.current = device_id;
        setDeviceId(device_id);
        setStatus('ready');
      });
      player.addListener('not_ready', () => setStatus('not_ready'));
      player.addListener('initialization_error', () => setStatus('unsupported'));
      player.addListener('authentication_error', () => setStatus('auth_error'));
      player.addListener('account_error', () => setStatus('non_premium'));

      playerRef.current = player;
      void player.connect();
    });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, []);

  const playClipAt = useCallback(async (trackUri: string, positionMs: number) => {
    const currentDeviceId = deviceIdRef.current;
    if (!currentDeviceId) return;
    const accessToken = await fetchAccessTokenRef.current();
    await fetch(`${PLAY_ENDPOINT}?device_id=${encodeURIComponent(currentDeviceId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [trackUri], position_ms: positionMs }),
    });
  }, []);

  const pause = useCallback(async () => {
    const currentDeviceId = deviceIdRef.current;
    if (!currentDeviceId) return;
    const accessToken = await fetchAccessTokenRef.current();
    await fetch(`${PAUSE_ENDPOINT}?device_id=${encodeURIComponent(currentDeviceId)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }, []);

  return { status, deviceId, playClipAt, pause };
}
