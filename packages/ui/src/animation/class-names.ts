import type { AnimationCSSVariables, AnimationConfig } from './types.js';

/**
 * Pure, synchronous mapping from an AnimationConfig to the animate.css
 * class name — no state, no timing. Split out from useAnimationTrigger so
 * orchestration that needs the class applied in the very same render as
 * some other change (e.g. AnimatedRoutes swapping page content) doesn't
 * have to round-trip through a hook whose own state updates land a render
 * (or an animation frame) later.
 */
export function animationClassName(config: AnimationConfig | undefined): string {
  return config ? `animate__animated animate__${config.name}` : '';
}

export function animationStyle(config: AnimationConfig | undefined): AnimationCSSVariables {
  if (!config) return {};
  return {
    ...(config.duration != null && { '--animate-duration': `${config.duration}ms` }),
    ...(config.delay != null && { '--animate-delay': `${config.delay}ms` }),
    ...(config.repeat != null && { '--animate-repeat': String(config.repeat) }),
  };
}
