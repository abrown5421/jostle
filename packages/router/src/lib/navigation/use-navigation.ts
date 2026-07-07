import { useCallback } from 'react';
import { navigationService } from './navigation-service';

export function useNavigation() {
  const navigate = useCallback((path: string) => {
    return navigationService.navigate(path);
  }, []);

  const navigateToKey = useCallback((key: string, params?: Record<string, string>) => {
    return navigationService.navigateToKey(key, params);
  }, []);

  const getPageByPath = useCallback((path: string) => {
    return navigationService.getPageByPath(path);
  }, []);

  const getPageByKey = useCallback((key: string) => {
    return navigationService.getPageByKey(key);
  }, []);

  return {
    navigate,
    navigateToKey,
    getPageByPath,
    getPageByKey,
  };
}