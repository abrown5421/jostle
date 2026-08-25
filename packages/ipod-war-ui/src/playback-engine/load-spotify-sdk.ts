import './spotify-sdk-types.js';

const SDK_SCRIPT_SRC = 'https://sdk.scdn.co/spotify-player.js';

let sdkPromise: Promise<void> | null = null;

export function loadSpotifyWebPlaybackSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }

    const previousReady = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previousReady?.();
      resolve();
    };

    const existingScript = document.querySelector(`script[src="${SDK_SCRIPT_SRC}"]`);
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = SDK_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  return sdkPromise;
}
