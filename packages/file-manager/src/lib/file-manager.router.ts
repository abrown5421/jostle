import { Router, Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

export interface FileManagerHandler<TCreate = unknown, TDelete = unknown> {
  resource: string;
  createSchema?: ZodTypeAny;
  deleteSchema?: ZodTypeAny;
  onCreate?: (body: TCreate) => Promise<unknown>;
  onDelete?: (params: TDelete) => Promise<unknown>;
  onAfterMutation?: () => Promise<void>;
}

export function createFileManagerRouter(handlers: FileManagerHandler<any, any>[]): Router {
  const router = Router();

  for (const handler of handlers) {
    const { resource, createSchema, deleteSchema, onCreate, onDelete, onAfterMutation } = handler;

    if (onCreate) {
      router.post(`/${resource}`, async (req: Request, res: Response, next: NextFunction) => {
        let data: unknown = req.body;

        if (createSchema) {
          const parsed = createSchema.safeParse(req.body);
          if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten() });
            return;
          }
          data = parsed.data;
        }

        try {
          const result = await onCreate(data);
          res.status(201).json(result ?? { message: `${resource} created.` });
          onAfterMutation?.().catch((err) =>
            console.error(`[file-manager:${resource}] onAfterMutation error:`, err),
          );
        } catch (err) {
          next(err);
        }
      });
    }

    if (onDelete) {
      router.delete(`/${resource}/:id`, async (req: Request, res: Response, next: NextFunction) => {
        let data: unknown = req.params;

        if (deleteSchema) {
          const parsed = deleteSchema.safeParse(req.params);
          if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten() });
            return;
          }
          data = parsed.data;
        }

        try {
          const result = await onDelete(data);
          res.status(200).json(result ?? { message: `${resource} deleted.` });
          onAfterMutation?.().catch((err) =>
            console.error(`[file-manager:${resource}] onAfterMutation error:`, err),
          );
        } catch (err) {
          next(err);
        }
      });
    }
  }

  return router;
}