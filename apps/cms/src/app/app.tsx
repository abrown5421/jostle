import { TransitionRouter, NavigationLink, useNavigation, navigationService } from '@inithium/router';
import { Box, Navbar, Text, Loader, Alert, FontLoader, useDarkMode } from '@inithium/ui';
import React, { useEffect, useMemo } from 'react';
import {
  useReadAllPagesQuery,
  selectActiveUser,
  useAuthBootstrap,
  useLogoutMutation,
  hideAlert,
  clearAlert,
  RootState,
  useReadAllSettingsQuery,
  useFriendNotifications,
  useActivityHeartbeat,
} from '@inithium/store';
import { useSelector, useDispatch } from 'react-redux';
import type { Page } from '@inithium/types';
import Login from '../../../../packages/pages/src/lib/login/login';

const App: React.FC = () => {
  useAuthBootstrap();
  useReadAllSettingsQuery();
  const dispatch = useDispatch();

  const { data, isLoading, error } = useReadAllPagesQuery();
  useReadAllSettingsQuery();
  const activeUser = useSelector(selectActiveUser);
  const alertData = useSelector((state: RootState) => state.alert.current);
  const [logout] = useLogoutMutation();
  const { navigateToKey } = useNavigation();
  useDarkMode(activeUser?.dark_mode);
  useFriendNotifications();
  useActivityHeartbeat();

  useEffect(() => {
    const isRootPath = window.location.pathname === '/';
    const hasValidSession = activeUser && activeUser._id;

    if (isRootPath && hasValidSession) {
      navigationService.navigate(`/cms/dashboard/${activeUser._id}`)
    }
  }, [activeUser, navigateToKey]);

  const mainNavPages = useMemo<Page[]>(() => {
    if (!data) return [];
    return [...data]
      .filter((page) => page.navigation?.location === 'cms')
      .sort((a, b) => (a.navigation?.order ?? 0) - (b.navigation?.order ?? 0));
  }, [data, activeUser]);

  const profileNavPages = useMemo<Page[]>(() => {
    if (!data) return [];
    return [...data]
      .filter((page) => page.navigation?.location === 'cms-profile')
      .sort((a, b) => (a.navigation?.order ?? 0) - (b.navigation?.order ?? 0));
  }, [data, activeUser]);

  const renderLink = (page: Page, className?: string) => {
    const params = activeUser?._id ? { id: activeUser._id } : undefined;
    return (
      <NavigationLink pageKey={page.key} params={params} className={className}>
        {page.navigation!.label}
      </NavigationLink>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigateToKey('login');
  };

  const renderBackendError = () => (
    <Box flex align="center" justify="center" fullWidth fullHeight className="h-full w-full">
      <Box color="surface" flex direction="col" align="center" padding="xl" className="rounded-xl">
        <Text variant="h1" color="danger">
          500
        </Text>
        <Box margin="lg">
          <Text variant="body2" color="danger">
            An error occurred. Please ensure the backend API is running.
          </Text>
        </Box>
      </Box>
    </Box>
  );

  const renderLoading = () => (
    <Box flex justify="center" align="center" className="h-full w-full">
      <Loader variant="spinner" size="lg" color="primary" />
    </Box>
  );

  const renderMainContent = () => (
    <Box>
      <Navbar
        pages={mainNavPages}
        profilePages={profileNavPages}
        activeUser={activeUser}
        renderLink={renderLink}
        onLogout={handleLogout}
      />
      <TransitionRouter />
    </Box>
  );

  const renderAuthenticatedView = () => (
    <Box color="surface-contrast" className="h-screen w-screen">
      {isLoading ? renderLoading() : error ? renderBackendError() : renderMainContent()}
    </Box>
  );

  return (
    <Box color="surface-contrast" className="h-screen w-screen relative">
      <FontLoader />
      {alertData && (
        <Alert
          alertData={alertData}
          onDismiss={() => dispatch(hideAlert())}
          onExited={() => dispatch(clearAlert())}
        />
      )}

      {activeUser ? renderAuthenticatedView() : <Login cmsMode restrictedRoles={['user']} />}
    </Box>
  );
};

export default App;