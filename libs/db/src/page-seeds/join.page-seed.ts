import type { CreatePageInput } from '../contracts/page.contract';

// Reached from the Home page's Join button or a host screen's QR code (/join?code=XXXXXX).
// Open to guests.
const joinPageSeed: CreatePageInput = {
  slug: 'join',
  title: 'Join',
  routePattern: '/join',
  isPluginPage: false,
  animation: { enter: 'animate__fadeIn', exit: 'animate__fadeOut', duration: 300, delay: 0 },
  backgroundColor: { color: 'surface', intensity: 100 },
  foregroundColor: { color: 'surface', intensity: 950 },
  access: { isPublic: true, isAnonymousOnly: false, requiredRoles: [] },
  navigation: { locations: [], label: 'Join', order: 0 },
  layoutTemplate: 'default',
  isPublished: true,
};

export default joinPageSeed;
