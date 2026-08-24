import { useCallback, useRef } from 'react';
import { createAudioPlayer } from './create-audio-player.js';
import type { AudioPlayer } from './types.js';

export function useSoundEffect(src: string): () => void {
  const playerRef = useRef<AudioPlayer | null>(null);
  if (!playerRef.current) playerRef.current = createAudioPlayer(src);

  return useCallback(() => {
    playerRef.current?.play();
  }, []);
}
