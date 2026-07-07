import { Router, Request, Response } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { friendsService } from './friends.service.js';
import { CreateFriendSchema, UpdateFriendSchema } from './friends.validators.js';

const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<void>) =>
  (req: Request, res: Response, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const crudRouter = createCrudRouter(friendsService, {
  onCreate: CreateFriendSchema,
  onUpdate: UpdateFriendSchema,
});

crudRouter.get(
  '/of/:id',
  asyncHandler(async (req, res) => {
    const records = await friendsService.readAllByUser(req.params.id);
    res.status(200).json(records);
  }),
);

export const friendsRouter: Router = crudRouter;