export { default as TransitionRouter }  from './lib/components/transition-router';
export { default as AnimatedPage }      from './lib/components/animated-page';
export { default as NavigationLink }    from './lib/components/navigation-link';
export type { AnimatedPageHandle }      from './lib/components/animated-page';

export { navigationService }            from './lib/navigation/navigation-service';
export { useNavigation }                from './lib/navigation/use-navigation';
export { useRouteGuard }                from './lib/hooks/use-route-guard';

export {
  bootstrapRegistry,
  resolvePageComponent,
  registerPageComponent,
  getRegisteredKeys,
} from './lib/registry/page-registry';
export { registerDynamicPage } from './lib/registry/dynamic-page-importer'
export type { AnyPageComponent, PageGlobMap } from './lib/registry/page-registry';