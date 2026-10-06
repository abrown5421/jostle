import { useEffect, useRef } from 'react';
import { playSound } from '../../app/sounds';
import type { SoundName } from '../../app/sounds';

// Plays a cue whenever `count` goes up within the same `scope` (a song, a round, ...). The first
// value seen in a scope is only a baseline, so a refresh or a new round never replays old cues.
export const useSoundOnIncrease = (count: number, scope: string, sound: SoundName = 'submit'): void => {
  const previous = useRef<{ readonly scope: string; readonly count: number } | null>(null);

  useEffect(() => {
    const last = previous.current;
    previous.current = { scope, count };
    if (last && last.scope === scope && count > last.count) playSound(sound);
  }, [count, scope, sound]);
};
