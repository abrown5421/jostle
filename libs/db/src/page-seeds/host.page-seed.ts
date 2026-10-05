import type { CreatePageInput } from '../contracts/page.contract';

// Reached from the Home page's Host button, not a nav. Public at the page level so a logged-out
// visitor gets a "log in to host" redirect instead of a 404 - POST /api/game-sessions is what
// actually enforces auth.
const hostPageSeed: CreatePageInput = {
  slug: 'host',
  title: 'Host',
  routePattern: '/host',
  isPluginPage: false,
  animation: { enter: 'animate__fadeIn', exit: 'animate__fadeOut', duration: 300, delay: 0 },
  backgroundColor: { color: 'surface', intensity: 100 },
  foregroundColor: { color: 'surface', intensity: 950 },
  access: { isPublic: true, isAnonymousOnly: false, requiredRoles: [] },
  navigation: { locations: [], label: 'Host', order: 0 },
  layoutTemplate: 'default',
  isPublished: true,
};

export default hostPageSeed;
