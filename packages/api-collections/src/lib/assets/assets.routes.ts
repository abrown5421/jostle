import { Router, Request, Response } from 'express';
import { validate } from '@inithium/api-core';
import { assetsService } from './assets.service.js';
import { CreateAssetSchema, UpdateAssetSchema } from './assets.validators.js';
import { softDeleteFile } from '@inithium/asset-manager';

export const assetsRouter: Router = Router();

assetsRouter.post('/batch-read', async (req: Request, res: Response, next) => {
  try {
    const { ids } = req.body as { ids: readonly string[] };
    res.status(200).json(await assetsService.readMany(ids ?? []));
  } catch (err) { next(err); }
});

assetsRouter.post('/batch-delete', async (req: Request, res: Response, next) => {
  try {
    const { ids } = req.body as { ids: readonly string[] };
    res.status(200).json(await assetsService.deleteMany(ids ?? []));
  } catch (err) { next(err); }
});

assetsRouter.get('/', async (_req: Request, res: Response, next) => {
  try {
    res.status(200).json(await assetsService.readAll());
  } catch (err) { next(err); }
});

assetsRouter.post('/', validate(CreateAssetSchema), async (req: Request, res: Response, next) => {
  try {
    res.status(201).json(await assetsService.createOne(req.body));
  } catch (err) { next(err); }
});

assetsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const record = await assetsService.readOne(req.params['id']);
    if (!record) { res.status(404).end(); return; }
    res.status(200).json(record);
  } catch (err) { next(err); }
});

assetsRouter.put('/:id', validate(UpdateAssetSchema), async (req: Request, res: Response, next) => {
  try {
    const record = await assetsService.updateOne(req.params['id'], req.body);
    if (!record) { res.status(404).end(); return; }
    res.status(200).json(record);
  } catch (err) { next(err); }
});

assetsRouter.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const record = await assetsService.deleteOne(req.params['id']);
    if (!record) { res.status(404).end(); return; }
    const fileResult = await softDeleteFile(
      record.storage_key,
      record.mimetype,
      record.owner_type,
      record.owner_id,
    );
    if (!fileResult.ok) {
      console.error(`[assets] File soft-delete failed for ${record.storage_key}:`, fileResult.error);
    }
    res.status(200).json(record);
  } catch (err) { next(err); }
});