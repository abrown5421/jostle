import type { ReactNode } from 'react';
import type { AnimationConfig } from '@jostle/ui';

export interface PageTransitionConfig {
  /** Played on the incoming page after the outgoing page finishes exiting. */
  enter: AnimationConfig;
  /** Played on the outgoing page before it's swapped out. */
  exit: AnimationConfig;
}

export interface PageRoute {
  /** Matched the same way as react-router's own Route path. */
  path: string;
  element: ReactNode;
  transition: PageTransitionConfig;
}
