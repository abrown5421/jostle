import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { gamesService } from './games.service.js';
import { CreateGameSchema, UpdateGameSchema } from './games.validators.js';
import type { Game } from '@inithium/types';

const router = Router();

router.get('/category/:category', async (req, res, next) => {
  try {
    const result = await gamesService.findByCategory(req.params.category as Game['category']);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

const crudRouter = createCrudRouter(gamesService, {
  onCreate: CreateGameSchema,
  onUpdate: UpdateGameSchema,
  forcePagination: true,
});

router.use(crudRouter);

export const gamesRouter = router;