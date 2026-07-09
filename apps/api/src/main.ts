import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

process.env['ASSETS_ROOT'] = path.resolve(__dirname, 'assets');

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { connectDB, createErrorHandler } from '@inithium/api-core';
import {
  usersRouter,
  pagesRouter,
  assetsRouter,
  assetsService,
  authRouter,
  settingsRouter,
  AssetModel,
  PageModel,
  SettingModel,
  UserModel,
  friendsRouter,
  systemErrorsRouter,
  SystemErrorModel,
  connectedAccountsRouter,
  ConnectedAccountModel,
  gamesRouter,
} from '@inithium/api-collections';
import { createAssetManager } from '@inithium/asset-manager';
import {
  createFileManagerRouter,
  writeFile,
  deleteFile,
  ensureDir,
  appendToFile,
  removeLineFromFile,
} from '@inithium/file-manager';
import {
  createDefaultAdapter,
  createPubSub,
  createSocketServer,
  createPresenceTracker,
  buildChannel,
} from '@inithium/pubsub';
import type { AccessTokenPayload } from '@inithium/types';
import { triggerEngagementDeploy } from './deploy-hook.service';
import { runHydration } from './run-hydration';
import { setFriendsPubSub } from '@inithium/api-collections';
import { SeedManifestModel } from './seed/manifest.model';
import { 
  createMediaIntegrationsRouter, 
  SpotifyProvider 
} from '@inithium/integrations';

const host = process.env['HOST'] ?? '0.0.0.0'; 
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3000;
const mongoUri = process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/my-app';

const AWAY_TIMEOUT_MS = 10 * 60 * 1000;
const PRESENCE_DOMAIN = 'presence';
const PRESENCE_ACTIVITY_EVENT = 'presence:activity';
const PRESENCE_STATUS_EVENT = 'status-changed';

const allowedOrigins = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:8080'];

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
const PAGES_LIB_DIR = path.join(REPO_ROOT, 'packages', 'pages', 'src', 'lib');
const PAGES_BARREL_INDEX = path.join(REPO_ROOT, 'packages', 'pages', 'src', 'index.ts');

const pageComponentTemplate = (componentName: string): string =>
  `import React from 'react';

const ${componentName}: React.FC = () => {
  return <div>${componentName}</div>;
};

export default ${componentName};
`;

const pageBarrelTemplate = (slug: string): string => `export * from './${slug}';\n`;

const pageExportLine = (slug: string): string => `\nexport * from './lib/${slug}/index';\n`;

const createPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, 'slug must be lowercase letters, numbers, and hyphens'),
  componentName: z
    .string()
    .min(1)
    .regex(/^[A-Z][A-Za-z0-9]+$/, 'componentName must be PascalCase'),
});

const deletePageSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, 'slug must be lowercase letters, numbers, and hyphens'),
});

type CreatePageDto = z.infer<typeof createPageSchema>;
type DeletePageDto = z.infer<typeof deletePageSchema>;

const fileManagerRouter = createFileManagerRouter([
  {
    resource: 'pages',
    createSchema: createPageSchema,
    deleteSchema: deletePageSchema,

    onCreate: async ({ slug, componentName }: CreatePageDto) => {
      const componentDir = path.join(PAGES_LIB_DIR, slug);
      await ensureDir({ dirPath: componentDir });
      await writeFile({
        filePath: path.join(componentDir, `${slug}.tsx`),
        content: pageComponentTemplate(componentName),
      });
      await writeFile({
        filePath: path.join(componentDir, 'index.ts'),
        content: pageBarrelTemplate(slug),
      });
      await appendToFile({
        filePath: PAGES_BARREL_INDEX,
        content: pageExportLine(slug),
      });
      return { message: `Page component "${componentName}" created successfully.`, slug };
    },

    onDelete: async ({ id: slug }: DeletePageDto) => {
      const componentDir = path.join(PAGES_LIB_DIR, slug);
      await deleteFile({ filePath: componentDir });
      await removeLineFromFile({
        filePath: PAGES_BARREL_INDEX,
        matcher: (line) => line.trim() === pageExportLine(slug).trim(),
      });
      return { message: `Page component "${slug}" deleted successfully.`, slug };
    },

    onAfterMutation: triggerEngagementDeploy,
  },
]);

const mediaIntegrationsRouter = createMediaIntegrationsRouter({
  providers: [
    new SpotifyProvider(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!,
      process.env.SPOTIFY_REDIRECT_URI!
    )
  ],
  onSaveConnection: async (userId: string, providerId: string, providerAccountId: string, credentials: any) => {
    await ConnectedAccountModel.updateOne(
      { userId, provider: providerId },
      {
        $set: {
          userId,
          provider: providerId,
          providerAccountId,
          status: 'active',
          credentials,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  },
  onLookupCredentials: async (userId: string, providerId: string) => {
    const account = await ConnectedAccountModel.findOne({ userId, provider: providerId, status: 'active' });
    if (!account) throw new Error('Account correlation matrix missing permissions');
    return account.credentials.accessToken;
  },
  frontendSuccessUrl: process.env.FRONTEND_SUCCESS_URL || 'http://localhost:5173/profile'
});

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/file-manager', fileManagerRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/system-errors', systemErrorsRouter);
app.use('/api/connected-accounts', connectedAccountsRouter);
app.use('/api/media-services', mediaIntegrationsRouter);
app.use('/api/games', gamesRouter);

app.get('/', (_req, res) => {
  res.send({ message: 'Inithium API' });
});

app.get('/api/debug/test-error', () => {
  throw new Error('Monorepo boundary decoupling test successful!');
});

app.use(
  createErrorHandler(async (payload) => {
    await SystemErrorModel.create(payload);
  })
);

async function bootstrap() {
  await connectDB(mongoUri);

  await runHydration({
    AssetModel,
    PageModel,
    SettingModel,
    UserModel,
    ManifestModel: SeedManifestModel,
  });

  const assetManager = await createAssetManager({
    assetsService: {
      createOne: (data) => assetsService.createOne(data),
      readOne: (id) => assetsService.readOne(id),
      findOne: (filter) => AssetModel.findOne(filter).lean().exec(),
    },
  });

  app.use('/api/asset-manager', assetManager.handshakeRouter);
  app.use('/api/assets', assetManager.proxyRouter);

  const pubsub = createPubSub(createDefaultAdapter());
  setFriendsPubSub(pubsub);

  const presenceTracker = createPresenceTracker({
    awayTimeoutMs: AWAY_TIMEOUT_MS,
    onStatusChange: (userId, status) => {
      pubsub.publish(buildChannel(PRESENCE_DOMAIN, userId), PRESENCE_STATUS_EVENT, { userId, status });
    },
  });

  if (process.env['NODE_ENV'] !== 'production') {
    app.post('/api/debug/publish', async (req, res) => {
      const { channel, event, payload } = req.body;
      await pubsub.publish(channel, event, payload);
      res.status(200).json({ message: 'published' });
    });
  }

  const httpServer = app.listen(port, host, () => {
    console.log(`[ ready  ] http://${host}:${port}`);
    console.log(`[ assets ] ${process.env['ASSETS_ROOT']}`);
  });

  const canJoinChannel = async (user: AccessTokenPayload, channel: string): Promise<boolean> =>
    channel.startsWith(`user:${user.sub}`) || channel.startsWith(`${PRESENCE_DOMAIN}:`);

  createSocketServer({
    httpServer,
    pubsub,
    canJoinChannel,
    corsOrigins: allowedOrigins,
    onConnect: (_socket, user) => presenceTracker.recordConnect(user.sub),
    onDisconnect: (_socket, user) => presenceTracker.recordDisconnect(user.sub),
    onChannelJoined: (socket, _user, channel) => {
      if (!channel.startsWith(`${PRESENCE_DOMAIN}:`)) return;
      const userId = channel.slice(`${PRESENCE_DOMAIN}:`.length);
      socket.emit(PRESENCE_STATUS_EVENT, { userId, status: presenceTracker.getStatus(userId) });
    },
    registerSocketHandlers: (socket, user) => {
      socket.on(PRESENCE_ACTIVITY_EVENT, () => presenceTracker.recordActivity(user.sub));
    },
  });

  process.on('unhandledRejection', async (reason: any) => {
    console.error('UNHANDLED REJECTION:', reason);
    try {
      await SystemErrorModel.create({
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
        statusCode: 500,
      });
    } catch (e) {
      console.error('Failed processing unhandled promise backup log', e);
    }
  });
}

bootstrap();