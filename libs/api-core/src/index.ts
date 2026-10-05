import type { Express } from 'express';
import healthRouter from './routes/health.route';
import authRouter from './routes/auth.route';
import apiUtilsCheckRouter from './routes/api-utils-check.route';
import pagesRouter from './routes/pages.route';
import presenceRouter from './routes/presence.route';
import notificationsRouter from './routes/notifications.route';
import usersRouter from './routes/users.route';
import settingsRouter from './routes/settings.route';
import profileRouter from './routes/profile.route';
import gameSessionsRouter from './routes/game-sessions.route';
import gamesRouter from './routes/games.route';
import integrationsRouter from './routes/integrations.route';
// inithium:block:friends:imports:start
import friendsRouter from './routes/friends.route';
// inithium:block:friends:imports:end
// inithium:anchor:imports

export const registerCoreRoutes = (app: Express): void => {
  app.use(healthRouter);
  app.use(authRouter);
  app.use(apiUtilsCheckRouter);
  app.use(pagesRouter);
  app.use(presenceRouter);
  app.use(notificationsRouter);
  app.use(usersRouter);
  app.use(settingsRouter);
  app.use(profileRouter);
  app.use(gameSessionsRouter);
  app.use(gamesRouter);
  app.use(integrationsRouter);
// inithium:block:friends:routes:start
  app.use(friendsRouter);
// inithium:block:friends:routes:end
  // inithium:anchor:routes
  console.log('✅ Core routes registered');
};

export { createCrudService } from './services/createCrudService';
export type { CrudRepository, CrudService } from './services/createCrudService';
