import type { AudioPlayer } from './types.js';

export function createAudioPlayer(src: string): AudioPlayer {
  let element: HTMLAudioElement | undefined;

  const play = (): void => {
    if (typeof Audio === 'undefined') return;
    if (!element) element = new Audio(src);
    element.currentTime = 0;
    try {
      element.play()?.catch?.(() => {});
    } catch {
      return;
    }
  };

  return { play };
}
