import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { sessionsService } from './sessions.service.js';
import { CreateSessionSchema, UpdateSessionSchema } from './sessions.validators.js';

const router = Router();

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

const crudRouter = createCrudRouter(sessionsService, {
  onCreate: CreateSessionSchema,
  onUpdate: UpdateSessionSchema,
  forcePagination: true,
});

router.use(crudRouter);

export const sessionsRouter = router;