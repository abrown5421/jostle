import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { pagesService } from './pages.service.js';
import { CreatePageSchema, UpdatePageSchema } from './pages.validators.js';

export const pagesRouter: Router = createCrudRouter(pagesService, {
  onCreate: CreatePageSchema,
  onUpdate: UpdatePageSchema,
});
