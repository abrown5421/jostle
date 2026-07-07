import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { systemErrorService } from './system-errors.service.js';

const router = Router();
const crudRouter = createCrudRouter(systemErrorService, {
  forcePagination: true,
});

router.use(crudRouter);

export const systemErrorsRouter = router;