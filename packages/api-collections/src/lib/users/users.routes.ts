import { Router } from 'express'; 
import { createCrudRouter } from '@inithium/api-core';
import { usersService } from './users.service.js';
import { CreateUserSchema, UpdateUserSchema } from './users.validators.js';
import type { GrowthRange } from '@inithium/api-core';

const router = Router();

router.get('/stats/growth', async (req, res, next) => {
  try {
    const range = (req.query.range as GrowthRange) ?? 'month';
    const result = await usersService.getUserGrowthStats(range);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

const crudRouter = createCrudRouter(usersService, {
  onCreate: CreateUserSchema,
  onUpdate: UpdateUserSchema,
  forcePagination: true,
});

router.use(crudRouter);

export const usersRouter = router;