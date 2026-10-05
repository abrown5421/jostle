// The slice of Spotify's Web Playback SDK (https://sdk.scdn.co/spotify-player.js) iPod War uses.
// It's a script tag, not an npm package, so it ships no types of its own.
declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface WebPlaybackTrack {
    uri: string;
    id: string | null;
    name: string;
    // Set when Spotify relinked the requested track to a regional equivalent.
    linked_from?: { uri: string | null };
  }

  interface WebPlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: { current_track: WebPlaybackTrack | null };
  }

  interface WebPlaybackError {
    message: string;
  }

  interface WebPlaybackInstance {
    device_id: string;
  }

  type ErrorEvent = 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error' | 'autoplay_failed';

  class Player {
    constructor(init: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'ready' | 'not_ready', callback: (instance: WebPlaybackInstance) => void): boolean;
    addListener(event: 'player_state_changed', callback: (state: WebPlaybackState | null) => void): boolean;
    addListener(event: ErrorEvent, callback: (error: WebPlaybackError) => void): boolean;
    activateElement(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
  }
}

interface Window {
  Spotify?: typeof Spotify;
  onSpotifyWebPlaybackSDKReady?: () => void;
}
