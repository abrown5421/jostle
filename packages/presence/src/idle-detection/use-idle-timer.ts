import { useEffect, useState } from 'react';
import { createIdleTracker } from './create-idle-tracker.js';

export function useIdleTimer(thresholdMs: number, target?: EventTarget): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const tracker = createIdleTracker({ thresholdMs, target });
    const unsubscribe = tracker.subscribe(setIsIdle);
    return () => {
      unsubscribe();
      tracker.dispose();
    };
  }, [thresholdMs, target]);

  return isIdle;
}
