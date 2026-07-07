import { Router } from 'express';
import {
  initStorageDirs,
  softDeleteFile,
  permanentDeleteFile,
  restoreFile,
  fileExists,
  resolveStoragePath,
} from './adapter/index.js';
import { createHandshakeRouter } from './handshake/index.js';
import { createProxyRouter } from './proxy/index.js';
import { startTokenGarbageCollector } from './handshake/token-store.js';
import { resolveCategory, toSchemaCategory } from './config/index.js';
import type { ProxyTarget } from './types/index.js';
import type { Asset } from '@inithium/types';

export interface AssetManagerService {
  createOne(data: Record<string, unknown>): Promise<Asset>;
  readOne(id: string): Promise<Asset | null>;
  findOne(filter: Record<string, unknown>): Promise<Asset | null>;
}

export interface AssetManagerDeps {
  assetsService: AssetManagerService;
}

export interface AssetManagerInstance {
  handshakeRouter: Router;
  proxyRouter: Router;
  softDelete: typeof softDeleteFile;
  permanentDelete: typeof permanentDeleteFile;
  restore: typeof restoreFile;
  fileExists: typeof fileExists;
}

export const createAssetManager = async (
  deps: AssetManagerDeps,
): Promise<AssetManagerInstance> => {
  await initStorageDirs();
  startTokenGarbageCollector();

  const finalizeAsset = async (params: {
    uploadId: string;
    storageKey: string;
    mimeType: string;
    originalName: string;
    size: number;
    sizeBytes: number;
    ownerType: 'app' | 'user';
    ownerId: string | null;
  }): Promise<{ asset_id: string }> => {
    const category = resolveCategory(params.mimeType);

    const created = await deps.assetsService.createOne({
      filename: params.storageKey,
      original_name: params.originalName,
      mimetype: params.mimeType,
      size: params.sizeBytes,
      storage_key: params.storageKey,
      category: toSchemaCategory(category),
      is_system_asset: false,
      owner_type: params.ownerType,
      owner_id: params.ownerId,
    });

    return { asset_id: String(created._id) };
  };

  const resolveTargetById = async (id: string): Promise<ProxyTarget | null> => {
    const record = await deps.assetsService.readOne(id);
    if (!record) return null;
    return {
      absolutePath: resolveStoragePath(
        record.storage_key,
        record.mimetype,
        record.owner_type,
        record.owner_id,
        record.storage_key,
      ),
      mimeType: record.mimetype,
      storageKey: record.storage_key,
    };
  };

  const resolveTargetByKey = async (storageKey: string): Promise<ProxyTarget | null> => {
    const record = await deps.assetsService.findOne({ storage_key: storageKey });
    if (!record) return null;
    return {
      absolutePath: resolveStoragePath(
        record.storage_key,
        record.mimetype,
        record.owner_type,
        record.owner_id,
        record.storage_key,
      ),
      mimeType: record.mimetype,
      storageKey: record.storage_key,
    };
  };

  return {
    handshakeRouter: createHandshakeRouter(finalizeAsset),
    proxyRouter: createProxyRouter({
      byId: resolveTargetById,
      byStorageKey: resolveTargetByKey,
    }),
    softDelete: softDeleteFile,
    permanentDelete: permanentDeleteFile,
    restore: restoreFile,
    fileExists,
  };
};
