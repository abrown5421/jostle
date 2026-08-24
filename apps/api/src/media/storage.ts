import {
  createDiskMediaStorage,
  resolveUploadsRoot,
} from '@jostle/media-storage';
import * as path from 'node:path';

export const uploadsRoot = resolveUploadsRoot({
  envValue: process.env.UPLOADS_DIR,
  fallbackDir: path.join(import.meta.dirname, '..', 'assets', 'images'),
});

export const assetBaseUrl =
  process.env.PUBLIC_ASSET_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 3333}`;

export const mediaStorage = createDiskMediaStorage({ rootDir: uploadsRoot });
