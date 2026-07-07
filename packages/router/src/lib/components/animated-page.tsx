import {
  Suspense,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Page } from '@inithium/types';
import { resolvePageComponent } from '../registry/page-registry';
import { Box, Loader } from '@inithium/ui';
import { Text } from '@inithium/ui';

const speedClassMap: Record<string, string> = {
  slow:    'animate__slow',
  slower:  'animate__slower',
  fast:    'animate__fast',
  faster:  'animate__faster',
};

export interface AnimatedPageHandle {
  playExit: () => Promise<void>;
}

interface AnimatedPageProps {
  page: Page;
}

const resolveBaseClasses = (page: Page): string =>
  [
    'h-m-nav',
    page.bg ? `bg-${page.bg}` : '',
    page.color ? `text-${page.color}` : '',
  ]
    .filter(Boolean)
    .join(' ');

const resolveLayoutProps = (page: Page) => ({
  className: resolveBaseClasses(page),
  ...(page.centered && { flex: true, align: 'center' as const, justify: 'center' as const }),
});

const AnimatedPage = forwardRef<AnimatedPageHandle, AnimatedPageProps>(
  ({ page }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      playExit: () =>
        new Promise<void>((resolve) => {
          const el = containerRef.current;
          if (!el) return resolve();

          const entryClass = `animate__${page.entry}`;
          const entrySpeedClass = page.entrySpeed ? speedClassMap[page.entrySpeed] : '';
          el.classList.remove('animate__animated', entryClass, entrySpeedClass);

          const exitClass = `animate__${page.exit}`;
          const exitSpeedClass = page.exitSpeed ? speedClassMap[page.exitSpeed] : '';
          const classes = ['animate__animated', exitClass];
          if (exitSpeedClass) classes.push(exitSpeedClass);

          el.classList.add(...classes);

          const onEnd = () => {
            el.removeEventListener('animationend', onEnd);
            resolve();
          };
          el.addEventListener('animationend', onEnd);

          const SAFETY_MS = 1500;
          setTimeout(resolve, SAFETY_MS);
        }),
    }));

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const entryClass = `animate__${page.entry}`;
      const entrySpeedClass = page.entrySpeed ? speedClassMap[page.entrySpeed] : '';
      const classes = ['animate__animated', entryClass];
      if (entrySpeedClass) classes.push(entrySpeedClass);

      el.classList.add(...classes);

      const onEnd = () => {
        el.removeEventListener('animationend', onEnd);
        el.classList.remove('animate__animated', entryClass, entrySpeedClass);
      };
      el.addEventListener('animationend', onEnd);
    }, [page]);

    const PageComponent = resolvePageComponent(page.componentKey);
    const layoutProps = resolveLayoutProps(page);

    if (!PageComponent) {
      return (
        <Box ref={containerRef} {...layoutProps}>
          <Box flex direction="col" align="center" padding="xl">
            <Text variant="h3">404</Text>
            <Text variant="body2" overrideClassName="w-1/3 text-center inline-block text-sm leading-relaxed font-normal text-primary mt-2 opacity-60">
              No component registered for key "{page.componentKey}". If you just created this page via the CMS try restarting the app. 
            </Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box ref={containerRef} {...layoutProps}>
        <Suspense
          fallback={
            <Box flex align="center" justify="center" fullWidth fullHeight>
              <Loader variant="spinner" size="lg" color="primary" />
            </Box>
          }
        >
          <PageComponent />
        </Suspense>
      </Box>
    );
  },
);

AnimatedPage.displayName = 'AnimatedPage';

export default AnimatedPage;