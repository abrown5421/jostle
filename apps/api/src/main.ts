import { checkDatabaseHealth, closeClient } from '@jostle/db';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as path from 'path';
import './games/seed.js';
import { closePubSubTransport } from './messaging/pubsub-client.js';
import { authRouter } from './routes/auth.js';
import { gamesRouter } from './routes/games.js';
import { notificationsRouter } from './routes/notifications.js';
import { sessionsRouter } from './routes/sessions.js';

const app = express();

// In dev, apps/web's Vite server proxies /api to this process, so the
// browser sees everything as same-origin and CORS never applies. This
// only matters when the API is actually hit cross-origin — e.g.
// production, if web and api end up on different hosts.
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: webOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/assets', express.static(path.join(import.meta.dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api!' });
});

app.get('/health', async (req, res) => {
  const database = await checkDatabaseHealth();
  const status = database.connected ? 'healthy' : 'unhealthy';
  res.status(database.connected ? 200 : 503).send({ status, database });
});

app.use('/auth', authRouter);
app.use('/notifications', notificationsRouter);
app.use('/sessions', sessionsRouter);
app.use('/games', gamesRouter);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);

const shutdown = async () => {
  server.close();
  await closePubSubTransport();
  await closeClient();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
