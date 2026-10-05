import type { CreatePageInput } from '../contracts/page.contract';

// The game catalogue. Public so anyone can browse; hosting from a game's details is what
// requires an account (POST /api/game-sessions enforces it, and the page redirects to login).
const gamesPageSeed: CreatePageInput = {
  slug: 'games',
  title: 'Games',
  routePattern: '/games',
  isPluginPage: false,
  animation: { enter: 'animate__fadeIn', exit: 'animate__fadeOut', duration: 300, delay: 0 },
  backgroundColor: { color: 'surface', intensity: 100 },
  foregroundColor: { color: 'surface', intensity: 950 },
  access: { isPublic: true, isAnonymousOnly: false, requiredRoles: [] },
  navigation: { locations: ['primary-nav'], label: 'Games', order: 10, icon: 'GameController' },
  layoutTemplate: 'default',
  isPublished: true,
};

export default gamesPageSeed;
