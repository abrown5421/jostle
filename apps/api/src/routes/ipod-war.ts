import { getUserForSessionToken } from '@jostle/auth';
import { getSessionById, listSessionPlayers } from '@jostle/game-sessions';
import type { PublicSession, PublicSessionPlayer } from '@jostle/game-sessions';
import { getValidAccessToken } from '@jostle/integrations';
import {
  buildAggregatedPlaylistOptions,
  GameNotConfiguredError,
  getRoundSnapshotForRole,
  HostSpotifyNotConnectedError,
  InsufficientSongsError,
  NoPlaylistSelectedError,
  NotEnoughPlayersError,
  recordSubmission,
  RoundNotAcceptingSubmissionsError,
  SessionNotInLobbyError,
  SPOTIFY_PROVIDER_ID,
  startGame,
} from '@jostle/ipod-war';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { pubsub } from '../messaging/pubsub-client.js';
import { SESSION_COOKIE } from './auth.js';

export const ipodWarRouter = Router();

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

async function requireHostSession(
  sessionId: string,
  req: Request,
  res: Response,
): Promise<PublicSession | null> {
  const actingUserId = await getAuthenticatedUserId(req);
  if (!actingUserId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found.' });
    return null;
  }

  if (session.hostUserId !== actingUserId) {
    res.status(403).json({ error: 'Only the host can do this.' });
    return null;
  }

  return session;
}

async function findSessionPlayer(
  sessionId: string,
  playerId: string,
): Promise<PublicSessionPlayer | undefined> {
  const players = await listSessionPlayers(sessionId);
  return players.find((player) => player.playerId === playerId);
}

ipodWarRouter.get('/:sessionId/ipod-war/playlist-options', async (req, res) => {
  const { sessionId } = req.params;
  const session = await requireHostSession(sessionId, req, res);
  if (!session) return;

  const playlists = await buildAggregatedPlaylistOptions(sessionId);
  res.json({ playlists });
});

ipodWarRouter.post('/:sessionId/ipod-war/start', async (req, res) => {
  const { sessionId } = req.params;
  const session = await requireHostSession(sessionId, req, res);
  if (!session) return;

  try {
    const state = await startGame({ pubsub, sessionId });
    res.status(201).json({ state });
  } catch (error) {
    if (error instanceof SessionNotInLobbyError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof HostSpotifyNotConnectedError) {
      res.status(400).json({ error: error.message, code: 'HOST_SPOTIFY_NOT_CONNECTED' });
      return;
    }
    if (error instanceof NotEnoughPlayersError) {
      res.status(400).json({ error: error.message, code: 'NOT_ENOUGH_PLAYERS' });
      return;
    }
    if (error instanceof GameNotConfiguredError) {
      res.status(400).json({ error: error.message, code: 'GAME_NOT_CONFIGURED' });
      return;
    }
    if (error instanceof NoPlaylistSelectedError) {
      res.status(400).json({ error: error.message, code: 'NO_PLAYLIST_SELECTED' });
      return;
    }
    if (error instanceof InsufficientSongsError) {
      res.status(400).json({
        error: error.message,
        code: 'INSUFFICIENT_SONGS',
        available: error.available,
        required: error.required,
      });
      return;
    }
    throw error;
  }
});

ipodWarRouter.get('/:sessionId/ipod-war/playback-token', async (req, res) => {
  const { sessionId } = req.params;
  const session = await requireHostSession(sessionId, req, res);
  if (!session) return;

  const accessToken = await getValidAccessToken(session.hostUserId, SPOTIFY_PROVIDER_ID);
  if (!accessToken) {
    res.status(400).json({ error: 'Host does not have a valid Spotify connection.' });
    return;
  }

  res.json({ accessToken });
});

ipodWarRouter.post('/:sessionId/ipod-war/submissions', async (req, res) => {
  const { sessionId } = req.params;
  const { playerId, trackName, artistName, albumName } = req.body ?? {};

  if (typeof playerId !== 'string' || typeof trackName !== 'string' || trackName.trim().length === 0) {
    res.status(400).json({ error: 'playerId and trackName are required.' });
    return;
  }

  const player = await findSessionPlayer(sessionId, playerId);
  if (!player) {
    res.status(404).json({ error: 'Player not found in this session.' });
    return;
  }

  const actingUserId = await getAuthenticatedUserId(req);
  if (player.userId !== null && player.userId !== actingUserId) {
    res.status(403).json({ error: 'Not authorized to submit for this player.' });
    return;
  }

  try {
    await recordSubmission({
      pubsub,
      sessionId,
      playerId,
      guess: {
        trackName,
        artistName: typeof artistName === 'string' ? artistName : undefined,
        albumName: typeof albumName === 'string' ? albumName : undefined,
      },
    });
    res.status(204).end();
  } catch (error) {
    if (error instanceof RoundNotAcceptingSubmissionsError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

ipodWarRouter.get('/:sessionId/ipod-war/snapshot', async (req, res) => {
  const { sessionId } = req.params;
  const role = req.query.role === 'host' ? 'host' : req.query.role === 'player' ? 'player' : null;

  if (!role) {
    res.status(400).json({ error: 'role must be "host" or "player".' });
    return;
  }

  if (role === 'host') {
    const session = await requireHostSession(sessionId, req, res);
    if (!session) return;

    const snapshot = await getRoundSnapshotForRole({ sessionId, role: 'host' });
    res.json({ snapshot });
    return;
  }

  const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  if (!playerId) {
    res.status(400).json({ error: 'playerId is required for role=player.' });
    return;
  }

  const player = await findSessionPlayer(sessionId, playerId);
  if (!player) {
    res.status(404).json({ error: 'Player not found in this session.' });
    return;
  }

  const actingUserId = await getAuthenticatedUserId(req);
  if (player.userId !== null && player.userId !== actingUserId) {
    res.status(403).json({ error: 'Not authorized to view this player.' });
    return;
  }

  const snapshot = await getRoundSnapshotForRole({ sessionId, role: 'player', playerId });
  res.json({ snapshot });
});
