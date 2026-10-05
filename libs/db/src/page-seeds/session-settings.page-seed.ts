import type { CreatePageInput } from '../contracts/page.contract';

// Where the host configures the selected game for one of their sessions, reached from the /host
// lobby or from picking a game on /games. Public at the page level like /host - the page itself
// redirects to login, and only the session's own host token can change anything.
const sessionSettingsPageSeed: CreatePageInput = {
  slug: 'session-settings',
  title: 'Game Settings',
  routePattern: '/settings/:code',
  isPluginPage: false,
  animation: { enter: 'animate__fadeIn', exit: 'animate__fadeOut', duration: 300, delay: 0 },
  backgroundColor: { color: 'surface', intensity: 100 },
  foregroundColor: { color: 'surface', intensity: 950 },
  access: { isPublic: true, isAnonymousOnly: false, requiredRoles: [] },
  navigation: { locations: [], label: 'Game Settings', order: 0 },
  layoutTemplate: 'default',
  isPublished: true,
};

export default sessionSettingsPageSeed;
