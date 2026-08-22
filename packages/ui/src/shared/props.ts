import type { CSSProperties } from 'react';
import type { AnimationConfig } from '../animation/index.js';

/**
 * Blowoff escape hatch every component accepts. Per the design system rule,
 * these must take precedence over every other visual prop — see cn.ts for
 * how className precedence is enforced, and StyleProps below for style.
 */
export interface BlowoffProps {
  className?: string;
  style?: CSSProperties;
}

/** Every component accepts an optional entrance/attention animation. */
export interface AnimatableProps {
  animation?: AnimationConfig;
}
