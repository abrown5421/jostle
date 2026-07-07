import { Router, Request, Response, NextFunction } from 'express';
import { readFileStream } from '../adapter/index.js';
import type { ProxyTarget } from '../types/index.js';

type AssetResolver = {
  byId: (id: string) => Promise<ProxyTarget | null>;
  byStorageKey: (storageKey: string) => Promise<ProxyTarget | null>;
};

const CACHE_CONTROL_PUBLIC = 'public, max-age=31536000, immutable';

const pipeAsset = (target: ProxyTarget, res: Response, next: NextFunction): void => {
  const result = readFileStream(target.absolutePath);

  if (!result.ok) {
    res.status(404).json({ error: result.error, code: result.code });
    return;
  }

  res.setHeader('Content-Type', target.mimeType);
  res.setHeader('Cache-Control', CACHE_CONTROL_PUBLIC);
  res.setHeader('X-Storage-Key', target.storageKey);

  result.data.on('error', (err) => {
    if (!res.headersSent) next(err);
  });

  result.data.pipe(res);
};

export const createProxyRouter = (resolver: AssetResolver): Router => {
  const router = Router();

  router.get('/by-id/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = await resolver.byId(req.params['id']);
      if (!target) {
        res.status(404).json({ error: 'Asset not found', code: 'NOT_FOUND' });
        return;
      }
      pipeAsset(target, res, next);
    } catch (err) {
      next(err);
    }
  });

  router.get(
    '/by-key/:storageKey(*)',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const target = await resolver.byStorageKey(req.params['storageKey']);
        if (!target) {
          res.status(404).json({ error: 'Asset not found', code: 'NOT_FOUND' });
          return;
        }
        pipeAsset(target, res, next);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
};
