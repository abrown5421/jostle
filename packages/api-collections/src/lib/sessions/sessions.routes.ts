import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { sessionsService } from './sessions.service.js';
import { CreateSessionSchema, UpdateSessionSchema, JoinSessionSchema } from './sessions.validators.js';

const router = Router();

router.get('/code/:joinCode', async (req, res, next) => {
  try {
    const session = await sessionsService.readOneByJoinCode(req.params.joinCode);
    if (!session) {
      res.status(404).end();
      return;
    }
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/join', async (req, res, next) => {
  try {
    const player = JoinSessionSchema.parse(req.body);
    const session = await sessionsService.joinSession(req.params.id, player);
    if (!session) {
      res.status(404).end();
      return;
    }
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/leave', async (req, res, next) => {
  try {
    const { player_id } = req.body as { player_id: string };
    const session = await sessionsService.leaveSession(req.params.id, player_id);
    if (!session) {
      res.status(404).end();
      return;
    }
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
});

const crudRouter = createCrudRouter(sessionsService, {
  onCreate: CreateSessionSchema,
  onUpdate: UpdateSessionSchema,
});

router.use(crudRouter);

export const sessionsRouter = router;