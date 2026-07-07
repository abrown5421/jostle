import { useEffect } from 'react';
import { matchPath } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsBootstrapping } from '@inithium/store';
import { Page } from '@inithium/types';
import { navigationService } from '../navigation/navigation-service';

export function useRouteGuard(pages: Page[] | undefined, pathname: string): void {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isBootstrapping = useSelector(selectIsBootstrapping);

  useEffect(() => {
    if (isBootstrapping || !pages) return;

    const matchedPage = pages.find((p) =>
      matchPath({ path: p.path, end: true }, pathname),
    );

    if (!matchedPage) return;

    const { anonymous, authenticated } = matchedPage.navigation ?? {};

    if (anonymous && authenticated) return;

    if (anonymous && !authenticated && isAuthenticated) {
      navigationService.navigate('/');
      return;
    }

    if (!anonymous && authenticated && !isAuthenticated) {
      navigationService.navigate('/');
      return;
    }
  }, [isBootstrapping, isAuthenticated, pages, pathname]);
}