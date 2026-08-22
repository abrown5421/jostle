import type { PageRoute } from '@jostle/router';
import { HomePage, LoginPage, SignupPage } from '../pages/index.js';

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
      enter: { name: 'fadeInUp', duration: 400 },
      exit: { name: 'fadeOutDown', duration: 300 },
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
];
