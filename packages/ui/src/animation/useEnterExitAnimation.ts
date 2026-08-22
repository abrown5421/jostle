import { useEffect, useRef, useState } from 'react';
import { useAnimationTrigger } from './useAnimationTrigger.js';
import type { AnimationConfig, AnimationHookResult } from './types.js';

export interface EnterExitAnimationConfig {
  enter: AnimationConfig;
  exit: AnimationConfig;
}

export interface EnterExitAnimationResult extends AnimationHookResult {
  /** False once the exit animation finishes — stop rendering the element then. */
  shouldRender: boolean;
}

/**
 * Declarative wrapper around useAnimationTrigger: flipping `visible` plays
 * the enter or exit animation automatically. `shouldRender` stays true
 * through the exit animation so the element can animate out before the
 * caller unmounts it, without the caller managing any animation state
 * itself.
 */
export function useEnterExitAnimation(
  visible: boolean,
  config: EnterExitAnimationConfig,
): EnterExitAnimationResult {
  const trigger = useAnimationTrigger();
  const [shouldRender, setShouldRender] = useState(visible);
  const wasVisible = useRef(visible);

  useEffect(() => {
    if (visible === wasVisible.current) return;
    wasVisible.current = visible;

    if (visible) {
      setShouldRender(true);
      trigger.play(config.enter);
    } else {
      trigger.play({
        ...config.exit,
        onComplete: () => {
          config.exit.onComplete?.();
          setShouldRender(false);
        },
      });
    }
    // Re-run only when visibility actually flips, not on every config identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return { ...trigger, shouldRender };
}
