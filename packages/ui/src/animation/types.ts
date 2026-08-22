import type { CSSProperties, RefObject } from 'react';
import type { ATTENTION_ANIMATIONS, ENTRANCE_ANIMATIONS, EXIT_ANIMATIONS } from './names.js';

export type EntranceAnimationName = (typeof ENTRANCE_ANIMATIONS)[number];
export type ExitAnimationName = (typeof EXIT_ANIMATIONS)[number];
export type AttentionAnimationName = (typeof ATTENTION_ANIMATIONS)[number];

// `(string & {})` keeps literal-name autocomplete while still accepting any
// animate.css class name the curated lists in ./names don't cover.
export type AnimationName =
  | EntranceAnimationName
  | ExitAnimationName
  | AttentionAnimationName
  | (string & {});

export interface AnimationConfig {
  name: AnimationName;
  /** ms; maps to animate.css's --animate-duration */
  duration?: number;
  /** ms; maps to animate.css's --animate-delay */
  delay?: number;
  /** maps to animate.css's --animate-repeat */
  repeat?: number | 'infinite';
  onComplete?: () => void;
}

export type AnimationCSSVariables = CSSProperties & {
  '--animate-duration'?: string;
  '--animate-delay'?: string;
  '--animate-repeat'?: string;
};

export interface AnimationController {
  readonly isAnimating: boolean;
  play: (config: AnimationConfig) => void;
  reset: () => void;
}

export interface AnimationHookResult extends AnimationController {
  ref: RefObject<HTMLElement | null>;
  className: string;
  style: AnimationCSSVariables;
}
