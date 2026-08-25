export {};

declare global {
  namespace Spotify {
    interface PlayerInit {
      name: string;
      getOAuthToken: (callback: (token: string) => void) => void;
      volume?: number;
    }

    interface WebPlaybackError {
      message: string;
    }

    interface WebPlaybackPlayer {
      device_id: string;
    }

    class Player {
      constructor(init: PlayerInit);
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(
        event: 'ready' | 'not_ready',
        callback: (data: WebPlaybackPlayer) => void,
      ): boolean;
      addListener(
        event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
        callback: (data: WebPlaybackError) => void,
      ): boolean;
    }
  }

  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: typeof Spotify;
  }
}
