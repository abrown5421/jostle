import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { connectedAccountsService } from './connected-accounts.service.js';
import { CreateConnectedAccountSchema, UpdateConnectedAccountSchema } from './connected-accounts.validators.js';

const router = Router();

router.get('/user/:userId', async (req, res, next) => {
  try {
    const result = await connectedAccountsService.findActiveByUser(req.params.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/user/:userId/provider/:provider', async (req, res, next) => {
  try {
    const result = await connectedAccountsService.findByProvider(req.params.userId, req.params.provider);
    if (!result) {
      res.status(404).end();
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

const crudRouter = createCrudRouter(connectedAccountsService, {
  onCreate: CreateConnectedAccountSchema,
  onUpdate: UpdateConnectedAccountSchema,
  forcePagination: true,
});

router.use(crudRouter);

export const connectedAccountsRouter = router;