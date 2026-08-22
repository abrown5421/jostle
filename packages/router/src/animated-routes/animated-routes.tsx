import { useAnimationTrigger } from '@jostle/ui';
import { useEffect, useState } from 'react';
import type { Ref } from 'react';
import { matchRoutes, useLocation } from 'react-router';
import type { PageRoute } from './types.js';

type TransitionPhase = 'entering' | 'entered' | 'exiting';

function findRoute(routes: PageRoute[], pathname: string): PageRoute | undefined {
  const matches = matchRoutes(routes, pathname);
  return matches?.[matches.length - 1]?.route as PageRoute | undefined;
}

export interface AnimatedRoutesProps {
  routes: PageRoute[];
}

/**
 * Sequential (not simultaneous) page transitions: navigating away plays the
 * CURRENT page's exit animation, and only once that finishes does the new
 * page get mounted and its enter animation played. Must render under a
 * react-router Router (e.g. BrowserRouter) since it reads useLocation.
 *
 * Each route supplies its own enter/exit AnimationConfig, so different
 * pages can use different animate.css effects (fadeIn vs fadeInUp, etc).
 */
export function AnimatedRoutes({ routes }: AnimatedRoutesProps) {
  const location = useLocation();
  const matched = findRoute(routes, location.pathname);

  const [displayed, setDisplayed] = useState(matched);
  const [phase, setPhase] = useState<TransitionPhase>('entering');
  const trigger = useAnimationTrigger();
  const { play } = trigger;

  // A navigation landed on a different route than what's on screen: exit
  // the current page first, and only swap content once that finishes.
  useEffect(() => {
    if (!matched || matched.path === displayed?.path) return;

    if (!displayed) {
      // Nothing was on screen yet (e.g. the initial URL matched no route) —
      // nothing to exit, so go straight to entering.
      setDisplayed(matched);
      setPhase('entering');
      return;
    }

    setPhase('exiting');
    play({
      ...displayed.transition.exit,
      onComplete: () => {
        setDisplayed(matched);
        setPhase('entering');
      },
    });
    // Only the target path should re-trigger this; `displayed`/`play` are
    // read fresh via closure and re-running on their identity would replay
    // the exit whenever the trigger hook's object identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched?.path]);

  // New content is on screen (or this is the initial mount) — play its
  // enter animation.
  useEffect(() => {
    if (phase !== 'entering' || !displayed) return;
    play({
      ...displayed.transition.enter,
      onComplete: () => setPhase('entered'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, displayed]);

  if (!displayed) return null;

  return (
    <div ref={trigger.ref as Ref<HTMLDivElement>} className={trigger.className} style={trigger.style}>
      {displayed.element}
    </div>
  );
}
