import { animationClassName, animationStyle } from '@jostle/ui';
import { useEffect, useRef, useState } from 'react';
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
 *
 * This deliberately doesn't use useAnimationTrigger. That hook is right for
 * "trigger one animation on demand, replaying the same name works" (a
 * button's hover shake, etc.), which needs its className to go through a
 * frame of no-class first so the browser sees the class removed before it's
 * re-added. Here the requirement is the opposite: the moment the outgoing
 * page's exit finishes, the incoming page's content AND its enter class
 * must land in the exact same render — any gap where the new page is
 * painted without its entrance class shows it at full opacity/position for
 * a frame before the animation starts, which reads as a flash/pop rather
 * than a clean transition. So className/style here are derived straight
 * from (phase, displayed) at render time, not from a separately-updated
 * "active animation" state.
 */
export function AnimatedRoutes({ routes }: AnimatedRoutesProps) {
  const location = useLocation();
  const matched = findRoute(routes, location.pathname);

  const [displayed, setDisplayed] = useState(matched);
  const [phase, setPhase] = useState<TransitionPhase>('entering');
  const ref = useRef<HTMLDivElement>(null);

  // A navigation landed on a different route than what's on screen: start
  // exiting the current page. The animationend handler below swaps content
  // to the new route and flips to 'entering' in one state update, only
  // once the exit finishes.
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
    // Only the target path should re-trigger this — `displayed` is read
    // fresh via closure, and re-running whenever it changes would re-enter
    // the branch above on every phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched?.path]);

  useEffect(() => {
    const node = ref.current;
    if (!node || phase === 'entered') return;

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== node) return;
      if (phase === 'exiting') {
        displayed?.transition.exit.onComplete?.();
        setDisplayed(matched);
        setPhase('entering');
      } else {
        displayed?.transition.enter.onComplete?.();
        setPhase('entered');
      }
    };

    node.addEventListener('animationend', handleAnimationEnd);
    return () => node.removeEventListener('animationend', handleAnimationEnd);
  }, [phase, matched, displayed]);

  if (!displayed) return null;

  const activeConfig =
    phase === 'exiting' ? displayed.transition.exit : phase === 'entering' ? displayed.transition.enter : undefined;

  return (
    <div ref={ref} className={animationClassName(activeConfig)} style={animationStyle(activeConfig)}>
      {displayed.element}
    </div>
  );
}
