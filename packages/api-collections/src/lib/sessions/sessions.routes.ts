import { Router } from 'express';
import type { Request } from 'express';
import { createCrudRouter, requireAuth, verifyAccessToken } from '@inithium/api-core';
import { sessionsService } from './sessions.service.js';
import {
  CreateSessionSchema,
  UpdateSessionSchema,
  HostSessionSchema,
  JoinSessionSchema,
} from './sessions.validators.js';

const router = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'none' as const,
  secure: true,
  maxAge: 1000 * 60 * 60 * 6,
};

const tryExtractUser = (req: Request) => {
  const token = req.cookies?.['access_token'];
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
};

router.get('/lobby/:lobbyId', async (req, res, next) => {
  try {
    const result = await sessionsService.findByLobbyId(req.params.lobbyId);
    if (!result) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/active/host/:hostId', async (req, res, next) => {
  try {
    const result = await sessionsService.findActiveByHost(req.params.hostId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/host', requireAuth, async (req, res, next) => {
  try {
    const parsed = HostSessionSchema.parse(req.body);
    const session = await sessionsService.hostSession(req.user!.sub, parsed.lobbyId);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

router.post('/lobby/:lobbyId/join', async (req, res, next) => {
  try {
    const parsed = JoinSessionSchema.parse(req.body);
    const existingUser = tryExtractUser(req);
    const { session, player, accessToken } = await sessionsService.joinSession(
      req.params.lobbyId,
      parsed.displayName,
      existingUser?.sub
    );
    if (!existingUser) {
      res.cookie('access_token', accessToken, cookieOptions);
    }
    res.status(200).json({ session, player });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/kick/:playerId', requireAuth, async (req, res, next) => {
  try {
    const session = await sessionsService.kickPlayer(req.params.id, req.user!.sub, req.params.playerId);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

const crudRouter = createCrudRouter(sessionsService, {
  onCreate: CreateSessionSchema,
  onUpdate: UpdateSessionSchema,
  forcePagination: true,
});

router.use(crudRouter);

export const sessionsRouter = router;