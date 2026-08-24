import { getUserForSessionToken } from '@jostle/auth';
import {
  addSessionPlayer,
  createSession as createGameSession,
  DisplayNameAlreadyInUseError,
  getSessionByJoinCode,
  getSessionById as getGameSessionById,
  getSessionConfiguration,
  listSessionPlayers,
  NotAuthorizedToRemovePlayerError,
  PlayerNotFoundError,
  removeSessionPlayer,
  setSessionConfiguration,
} from '@jostle/game-sessions';
import { getGameById, validateSelectedSettings } from '@jostle/games';
import { publishTopic, sessionConfigTopic, sessionRosterTopic } from '@jostle/messaging';
import { Router } from 'express';
import type { Request } from 'express';
import { pubsub } from '../messaging/pubsub-client.js';
import { SESSION_COOKIE } from './auth.js';

export const sessionsRouter = Router();

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

sessionsRouter.post('/', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const session = await createGameSession({ hostUserId: userId });
  res.status(201).json({ session });
});

sessionsRouter.get('/by-code/:joinCode', async (req, res) => {
  const session = await getSessionByJoinCode(req.params.joinCode);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }
  res.json({ session });
});

sessionsRouter.get('/:sessionId', async (req, res) => {
  const session = await getGameSessionById(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }
  res.json({ session });
});

sessionsRouter.get('/:sessionId/players', async (req, res) => {
  const players = await listSessionPlayers(req.params.sessionId);
  res.json({ players });
});

sessionsRouter.post('/:sessionId/players', async (req, res) => {
  const { sessionId } = req.params;
  const { displayName, avatarUrl } = req.body ?? {};

  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    res.status(400).json({ error: 'displayName is required.' });
    return;
  }

  const userId = await getAuthenticatedUserId(req);

  try {
    const player = await addSessionPlayer({
      sessionId,
      userId,
      displayName,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : undefined,
    });

    await publishTopic(pubsub, sessionRosterTopic, {
      params: { sessionId },
      payload: { kind: 'PLAYER_JOINED', player },
    });

    res.status(201).json({ player });
  } catch (error) {
    if (error instanceof DisplayNameAlreadyInUseError) {
      res.status(409).json({ error: error.message, field: 'displayName' });
      return;
    }
    throw error;
  }
});

sessionsRouter.delete('/:sessionId/players/:playerId', async (req, res) => {
  const { sessionId, playerId } = req.params;
  const actingUserId = await getAuthenticatedUserId(req);

  try {
    const { player, removedByHost } = await removeSessionPlayer({ sessionId, playerId, actingUserId });

    await publishTopic(pubsub, sessionRosterTopic, {
      params: { sessionId },
      payload: { kind: removedByHost ? 'PLAYER_KICKED' : 'PLAYER_LEFT', player },
    });

    res.json({ player });
  } catch (error) {
    if (error instanceof PlayerNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof NotAuthorizedToRemovePlayerError) {
      res.status(403).json({ error: error.message });
      return;
    }
    throw error;
  }
});

sessionsRouter.get('/:sessionId/configuration', async (req, res) => {
  const configuration = await getSessionConfiguration(req.params.sessionId);
  res.json({ configuration });
});

sessionsRouter.put('/:sessionId/configuration', async (req, res) => {
  const { sessionId } = req.params;
  const { gameId, selectedSettings } = req.body ?? {};

  const actingUserId = await getAuthenticatedUserId(req);
  if (!actingUserId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const session = await getGameSessionById(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return;
  }
  if (actingUserId !== session.hostUserId) {
    res.status(403).json({ error: 'Only the host can configure this session.' });
    return;
  }

  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    res.status(400).json({ error: 'gameId is required.' });
    return;
  }

  const game = await getGameById(gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  const validation = validateSelectedSettings(game.defaultSettingsSchema, selectedSettings ?? {});
  if (!validation.valid) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const { configuration, isNewGameSelection } = await setSessionConfiguration({
    sessionId,
    gameId,
    selectedSettings: validation.sanitizedSettings,
  });

  await publishTopic(pubsub, sessionConfigTopic, {
    params: { sessionId },
    payload: {
      kind: isNewGameSelection ? 'GAME_SELECTED' : 'CONFIGURATION_UPDATED',
      sessionId,
      gameId: configuration.gameId,
      selectedSettings: configuration.selectedSettings,
    },
  });

  res.json({ configuration });
});
