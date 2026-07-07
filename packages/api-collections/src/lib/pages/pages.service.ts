import { createCrudService, CrudService } from '@inithium/api-core';
import type { Page } from '@inithium/types';
import { PageModel } from './pages.model.js';

export interface PagesService extends CrudService<Page> {
  // Extend here with pages-specific methods as needed
}

export const pagesService: PagesService = {
  ...createCrudService<Page>(PageModel),
};
