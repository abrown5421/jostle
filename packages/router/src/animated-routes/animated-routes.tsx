import { animationClassName, animationStyle } from '@jostle/ui';
import { useEffect, useRef, useState } from 'react';
import { matchRoutes, Route, Routes, useLocation } from 'react-router';
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
 * Renders through react-router's own <Routes location={...}> with a
 * "frozen" location that only catches up to the real one once the exit
 * animation finishes — react-router's documented pattern for animated
 * route transitions. This matters beyond animation: it's what keeps
 * useParams()/useMatch()/nested routes working normally inside each page,
 * versus matching a route ourselves and rendering its element directly
 * (which never establishes react-router's own route context).
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
 * from (phase, the route matching the frozen location) at render time, not
 * from a separately-updated "active animation" state.
 */
export function AnimatedRoutes({ routes }: AnimatedRoutesProps) {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [phase, setPhase] = useState<TransitionPhase>('entering');
  const ref = useRef<HTMLDivElement>(null);

  const activeRoute = findRoute(routes, displayedLocation.pathname);

  // A navigation landed on a different pathname than what's on screen:
  // start exiting the current page. The animationend handler below
  // catches the frozen location up to the real one (and flips to
  // 'entering') only once the exit finishes.
  useEffect(() => {
    if (location.pathname === displayedLocation.pathname) return;

    if (!activeRoute) {
      // Nothing was actually on screen (e.g. the initial URL matched no
      // route) — nothing to exit, so catch up immediately.
      setDisplayedLocation(location);
      setPhase('entering');
      return;
    }

    setPhase('exiting');
    // Only the target pathname should re-trigger this — `activeRoute` is
    // read fresh via closure, and re-running whenever it changes would
    // re-enter this effect on every phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const node = ref.current;
    if (!node || phase === 'entered') return;

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== node) return;
      if (phase === 'exiting') {
        activeRoute?.transition.exit.onComplete?.();
        setDisplayedLocation(location);
        setPhase('entering');
      } else {
        activeRoute?.transition.enter.onComplete?.();
        setPhase('entered');
      }
    };

    node.addEventListener('animationend', handleAnimationEnd);
    return () => node.removeEventListener('animationend', handleAnimationEnd);
  }, [phase, location, activeRoute]);

  const activeConfig =
    phase === 'exiting' ? activeRoute?.transition.exit : phase === 'entering' ? activeRoute?.transition.enter : undefined;

  return (
    <div ref={ref} className={animationClassName(activeConfig)} style={animationStyle(activeConfig)}>
      <Routes location={displayedLocation}>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
  );
}
