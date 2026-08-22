import { checkDatabaseHealth, closeClient } from '@jostle/db';
import express from 'express';
import * as path from 'path';

const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api!' });
});

app.get('/health', async (req, res) => {
  const database = await checkDatabaseHealth();
  const status = database.connected ? 'healthy' : 'unhealthy';
  res.status(database.connected ? 200 : 503).send({ status, database });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);

const shutdown = async () => {
  server.close();
  await closeClient();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
