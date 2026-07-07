import { createCrudService, CrudService } from '@inithium/api-core';
import type { Asset } from '@inithium/types';
import { AssetModel } from './assets.model.js';

export interface AssetsService extends CrudService<Asset> {
  // Extend here with assets-specific methods as needed
}

export const assetsService: AssetsService = {
  ...createCrudService<Asset>(AssetModel),
};
