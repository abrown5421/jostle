import { useCallback, useEffect, useRef, useState } from 'react';
import { animationClassName, animationStyle } from './class-names.js';
import type { AnimationConfig, AnimationHookResult } from './types.js';

/**
 * Imperative animation primitive: attach `ref` + spread `className`/`style`
 * onto any element to make it animate.css-capable, then call `play(config)`
 * to trigger an animation on demand. Handles adding/removing the
 * `animate__*` classes and the `animationend` listener itself, so the
 * element it's attached to never needs its own DOM listener code.
 */
export function useAnimationTrigger(): AnimationHookResult {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<AnimationConfig | null>(null);
  const onCompleteRef = useRef<AnimationConfig['onComplete']>(undefined);

  const reset = useCallback(() => {
    setActive(null);
  }, []);

  const play = useCallback((config: AnimationConfig) => {
    onCompleteRef.current = config.onComplete;
    // Drop to idle for a frame first so re-triggering the same animation
    // name restarts it instead of being a no-op (class already present).
    setActive(null);
    requestAnimationFrame(() => setActive(config));
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !active) return;

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== node) return;
      onCompleteRef.current?.();
      setActive(null);
    };

    node.addEventListener('animationend', handleAnimationEnd);
    return () => node.removeEventListener('animationend', handleAnimationEnd);
  }, [active]);

  return {
    ref,
    className: animationClassName(active ?? undefined),
    style: animationStyle(active ?? undefined),
    isAnimating: active !== null,
    play,
    reset,
  };
}
