import { useEffect } from 'react';
import { useAnimationTrigger } from './useAnimationTrigger.js';
import type { AnimationConfig, AnimationHookResult } from './types.js';

/**
 * Adapts the imperative useAnimationTrigger to a declarative `animation?`
 * prop: whenever the config's identity-relevant fields change (including
 * on mount), it plays automatically. This is what every UI primitive's
 * `animation` prop is wired to — components stay dumb, they just spread
 * the returned ref/className/style onto their root element.
 */
export function useAnimationProp(config?: AnimationConfig): AnimationHookResult {
  const trigger = useAnimationTrigger();
  const { play } = trigger;

  useEffect(() => {
    if (config) play(config);
  }, [config?.name, config?.duration, config?.delay, config?.repeat, play]);

  return trigger;
}
