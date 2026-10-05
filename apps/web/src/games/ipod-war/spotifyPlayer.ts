// The host browser's Spotify player (the Web Playback SDK) as a module-level singleton, read with
// useSyncExternalStore. A singleton because one player must survive the move from
// /settings/:code (where the Start click unlocks audio on it) to /host (where it plays) - each
// page retains it, and it only disconnects once nothing has held it for a moment. Same recipe as
// @inithium/api-client's retainGameSession.

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';
const API_ROOT = 'https://api.spotify.com/v1';
const PLAYER_NAME = 'Jostle · iPod War';
const RELEASE_GRACE_MS = 5_000;
// How long a play request may take to actually produce sound before it counts as failed.
const PLAY_CONFIRM_TIMEOUT_MS = 10_000;
const DEVICE_SETTLE_MS = 800;

export type SpotifyPlayerStatus = 'idle' | 'loading' | 'ready' | 'not-ready' | 'unsupported' | 'error';

export type SpotifyPlayerErrorKind = 'initialization' | 'authentication' | 'account' | 'playback' | 'autoplay';

export interface SpotifyPlayerState {
  readonly status: SpotifyPlayerStatus;
  readonly deviceId: string | null;
  readonly error: { readonly kind: SpotifyPlayerErrorKind; readonly message: string } | null;
  // What the SDK last reported playing on this device.
  readonly trackUri: string | null;
  readonly paused: boolean;
}

const INITIAL_STATE: SpotifyPlayerState = { status: 'idle', deviceId: null, error: null, trackUri: null, paused: true };

let state: SpotifyPlayerState = INITIAL_STATE;
let player: Spotify.Player | null = null;
let tokenProvider: (() => Promise<string>) | null = null;
let retainCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let sdkReady: Promise<void> | null = null;
let connecting: Promise<void> | null = null;

const listeners = new Set<() => void>();
const playbackListeners = new Set<(playback: Spotify.WebPlaybackState | null) => void>();

const setState = (patch: Partial<SpotifyPlayerState>): void => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const getSpotifyPlayerState = (): SpotifyPlayerState => state;

export const subscribeToSpotifyPlayer = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// The SDK only runs where browsers support the DRM it needs - desktop Chrome, Edge, Firefox and
// Safari. Phones and tablets never do, whatever their browser.
export const isSpotifyPlaybackSupported = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac.
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return !isMobile && typeof navigator.requestMediaKeySystemAccess === 'function';
};

const loadSdk = (): Promise<void> => {
  if (sdkReady) return sdkReady;
  sdkReady = new Promise<void>((resolve, reject) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => {
      sdkReady = null;
      script.remove();
      reject(new Error('Could not load the Spotify player'));
    };
    document.body.appendChild(script);
  });
  return sdkReady;
};

const getToken = (): Promise<string> => {
  if (!tokenProvider) return Promise.reject(new Error('Spotify is not connected'));
  return tokenProvider();
};

const ERROR_MESSAGES: Record<SpotifyPlayerErrorKind, string> = {
  initialization: "This browser can't play Spotify - use desktop Chrome, Edge, Firefox or Safari.",
  authentication: 'Spotify needs you to reconnect your account from your profile.',
  account: 'Spotify Premium is required to play music here.',
  playback: 'Spotify had trouble playing that song.',
  autoplay: 'The browser blocked audio - press Resume to allow it.',
};

const connectPlayer = async (): Promise<void> => {
  if (!isSpotifyPlaybackSupported()) {
    setState({ status: 'unsupported' });
    return;
  }
  setState({ status: 'loading', error: null });
  try {
    await loadSdk();
  } catch (error) {
    setState({ status: 'error', error: { kind: 'initialization', message: (error as Error).message } });
    return;
  }
  if (player || !window.Spotify) return;
  // Released while the SDK was loading.
  if (retainCount === 0) {
    setState(INITIAL_STATE);
    return;
  }

  const created = new window.Spotify.Player({
    name: PLAYER_NAME,
    // Called by the SDK whenever it needs a token (and again as each expires) - the API refreshes
    // the host's token server-side.
    getOAuthToken: (callback) => {
      getToken()
        .then(callback)
        .catch(() => setState({ status: 'error', error: { kind: 'authentication', message: ERROR_MESSAGES.authentication } }));
    },
    volume: 0.8,
  });
  created.addListener('ready', ({ device_id }) => setState({ status: 'ready', deviceId: device_id, error: null }));
  created.addListener('not_ready', () => setState({ status: 'not-ready' }));
  created.addListener('player_state_changed', (playback) => {
    setState({ trackUri: playback?.track_window.current_track?.uri ?? null, paused: playback?.paused ?? true });
    playbackListeners.forEach((listener) => listener(playback));
  });
  (['initialization_error', 'authentication_error', 'account_error'] as const).forEach((event) =>
    created.addListener(event, () => {
      const kind = event.replace('_error', '') as SpotifyPlayerErrorKind;
      setState({ status: 'error', error: { kind, message: ERROR_MESSAGES[kind] } });
    }),
  );
  // Transient - the game reports it for this song rather than the player being broken.
  created.addListener('playback_error', ({ message }) => setState({ error: { kind: 'playback', message: message || ERROR_MESSAGES.playback } }));
  created.addListener('autoplay_failed', () => setState({ error: { kind: 'autoplay', message: ERROR_MESSAGES.autoplay } }));

  player = created;
  const connected = await created.connect();
  if (!connected) setState({ status: 'error', error: { kind: 'initialization', message: ERROR_MESSAGES.initialization } });
};

const disconnectPlayer = (): void => {
  player?.disconnect();
  player = null;
  setState(INITIAL_STATE);
};

// Holds the player open (connecting it on first use). `token` fetches a fresh Spotify access token
// for the host. Returns the release function, shaped to be returned from a useEffect.
export const retainSpotifyPlayer = (token: () => Promise<string>): (() => void) => {
  tokenProvider = token;
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
  retainCount += 1;
  if (!player && !connecting) {
    connecting = connectPlayer().finally(() => {
      connecting = null;
    });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount = Math.max(0, retainCount - 1);
    if (retainCount > 0) return;
    releaseTimer = setTimeout(() => {
      releaseTimer = null;
      if (retainCount === 0) disconnectPlayer();
    }, RELEASE_GRACE_MS);
  };
};

// Browsers only allow audio after a user gesture - call this synchronously inside a click (Start,
// Resume, Play here) before anything plays.
export const activateSpotifyPlayer = (): Promise<void> => {
  if (state.error?.kind === 'autoplay') setState({ error: null });
  return player?.activateElement() ?? Promise.resolve();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callWebApi = async (path: string, init: RequestInit): Promise<Response> => {
  const token = await getToken();
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
};

const describeFailure = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  return body.error?.message ?? `Spotify refused to play (${response.status})`;
};

const isPlaying = (playback: Spotify.WebPlaybackState | null, uri: string): boolean => {
  const track = playback?.track_window.current_track;
  return Boolean(playback && !playback.paused && track && (track.uri === uri || track.linked_from?.uri === uri));
};

// Resolves once the SDK reports `uri` actually playing on this device.
const waitUntilPlaying = (uri: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      playbackListeners.delete(listener);
      reject(new Error("Spotify didn't start playing - check the host computer's audio and try again."));
    }, PLAY_CONFIRM_TIMEOUT_MS);
    const listener = (playback: Spotify.WebPlaybackState | null) => {
      if (!isPlaying(playback, uri)) return;
      clearTimeout(timer);
      playbackListeners.delete(listener);
      resolve();
    };
    playbackListeners.add(listener);
  });

// Plays `uri` from `positionMs` on this browser's player, resolving once it's audibly playing.
export const playSpotifyClip = async (uri: string, positionMs: number): Promise<void> => {
  const deviceId = state.deviceId;
  if (!deviceId || state.status !== 'ready') throw new Error('The Spotify player isn’t ready yet.');
  const body = JSON.stringify({ uris: [uri], position_ms: Math.max(0, Math.round(positionMs)) });
  const playing = waitUntilPlaying(uri);
  // Don't leave the confirmation's rejection unhandled if the request itself fails first.
  playing.catch(() => undefined);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await callWebApi(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: 'PUT', body });
    if (response.ok) return playing;
    if (response.status === 404 && attempt === 0) {
      // Spotify doesn't know this device yet (common right after connecting) - hand playback to it
      // explicitly, then try again.
      await callWebApi('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play: false }) });
      await sleep(DEVICE_SETTLE_MS);
      continue;
    }
    if (response.status === 429 || response.status >= 500) {
      await sleep(Math.min(5_000, Number(response.headers.get('Retry-After') ?? '1') * 1000));
      continue;
    }
    throw new Error(await describeFailure(response));
  }
  throw new Error('Spotify is busy - try again in a moment.');
};

export const pauseSpotify = (): Promise<void> => player?.pause().catch(() => undefined) ?? Promise.resolve();
