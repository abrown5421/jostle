import type { PageRoute } from '@jostle/router';
import { GamesPage, HomePage, HostPage, JoinPage, LoginPage, ProfilePage, SettingsPage, SignupPage } from '../pages/index.js';

// Each route owns its own enter/exit pair, deliberately varied to show the
// transition framework isn't tied to one effect.
export const routes: PageRoute[] = [
  {
    path: '/',
    element: <HomePage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
  {
    path: '/login',
    element: <LoginPage />,
    transition: {
      enter: { name: 'zoomIn', duration: 400 },
      exit: { name: 'zoomOut', duration: 300 },
    },
  },
  {
    path: '/signup',
    element: <SignupPage />,
    transition: {
      enter: { name: 'zoomIn', duration: 400 },
      exit: { name: 'zoomOut', duration: 300 },
    },
  },
  {
    path: '/profile/:id',
    element: <ProfilePage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
  {
    path: '/host/:sessionId',
    element: <HostPage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
  {
    path: '/host/:sessionId/settings',
    element: <SettingsPage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
  {
    path: '/join',
    element: <JoinPage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
  {
    path: '/games',
    element: <GamesPage />,
    transition: {
      enter: { name: 'fadeIn', duration: 400 },
      exit: { name: 'fadeOut', duration: 300 },
    },
  },
];
