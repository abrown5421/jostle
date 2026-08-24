import { randomUUID } from 'node:crypto';
import { mkdir, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import {
  isMediaFileForUser,
  resolveMediaFileName,
} from '../file-naming/index.js';
import type { MediaAssetKind } from '../file-naming/index.js';

export interface ResolveUploadsRootOptions {
  envValue: string | undefined;
  fallbackDir: string;
}

export function resolveUploadsRoot(options: ResolveUploadsRootOptions): string {
  const trimmed = options.envValue?.trim();
  return trimmed ? trimmed : options.fallbackDir;
}

export interface SaveMediaAssetInput {
  userId: string;
  kind: MediaAssetKind;
  buffer: Buffer;
  extension: string;
}

export interface SavedMediaAsset {
  fileName: string;
  relativePath: string;
}

export interface MediaStorageService {
  saveAsset(input: SaveMediaAssetInput): Promise<SavedMediaAsset>;
}

export interface DiskMediaStorageConfig {
  rootDir: string;
}

async function removeStaleAssetFiles(
  rootDir: string,
  kind: MediaAssetKind,
  userId: string,
  currentFileName: string,
): Promise<void> {
  const entries = await readdir(rootDir);
  const staleEntries = entries.filter(
    (entry) =>
      entry !== currentFileName && isMediaFileForUser(kind, userId, entry),
  );
  await Promise.all(
    staleEntries.map((entry) =>
      unlink(path.join(rootDir, entry)).catch(() => undefined),
    ),
  );
}

export function createDiskMediaStorage(
  config: DiskMediaStorageConfig,
): MediaStorageService {
  const { rootDir } = config;

  async function saveAsset(
    input: SaveMediaAssetInput,
  ): Promise<SavedMediaAsset> {
    const { userId, kind, buffer, extension } = input;
    await mkdir(rootDir, { recursive: true });

    const fileName = resolveMediaFileName(kind, userId, extension);
    const targetPath = path.join(rootDir, fileName);
    const tempPath = path.join(rootDir, `.${fileName}.${randomUUID()}.tmp`);

    await writeFile(tempPath, buffer);
    await rename(tempPath, targetPath);
    await removeStaleAssetFiles(rootDir, kind, userId, fileName);

    return { fileName, relativePath: fileName };
  }

  return { saveAsset };
}
