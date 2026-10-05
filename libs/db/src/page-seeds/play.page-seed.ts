import type { CreatePageInput } from '../contracts/page.contract';

// A player's in-session screen, landed on after a successful join. Open to guests - the seat
// token in the device's storage is what grants access, not the page.
const playPageSeed: CreatePageInput = {
  slug: 'play',
  title: 'Play',
  routePattern: '/play/:code',
  isPluginPage: false,
  animation: { enter: 'animate__fadeIn', exit: 'animate__fadeOut', duration: 300, delay: 0 },
  backgroundColor: { color: 'surface', intensity: 100 },
  foregroundColor: { color: 'surface', intensity: 950 },
  access: { isPublic: true, isAnonymousOnly: false, requiredRoles: [] },
  navigation: { locations: [], label: 'Play', order: 0 },
  layoutTemplate: 'default',
  isPublished: true,
};

export default playPageSeed;
