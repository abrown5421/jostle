import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDiskMediaStorage,
  resolveUploadsRoot,
} from './storage-adapter.js';

describe('resolveUploadsRoot', () => {
  it('uses the env value when set', () => {
    expect(
      resolveUploadsRoot({
        envValue: '/data/uploads',
        fallbackDir: '/tmp/fallback',
      }),
    ).toBe('/data/uploads');
  });

  it('falls back when the env value is unset or blank', () => {
    expect(
      resolveUploadsRoot({ envValue: undefined, fallbackDir: '/tmp/fallback' }),
    ).toBe('/tmp/fallback');
    expect(
      resolveUploadsRoot({ envValue: '   ', fallbackDir: '/tmp/fallback' }),
    ).toBe('/tmp/fallback');
  });
});

describe('createDiskMediaStorage', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), 'media-storage-'));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('writes an avatar deterministically as <userId>.<ext>', async () => {
    const storage = createDiskMediaStorage({ rootDir });

    const saved = await storage.saveAsset({
      userId: 'user123',
      kind: 'avatar',
      buffer: Buffer.from('fake-png'),
      extension: 'png',
    });

    expect(saved).toEqual({
      fileName: 'user123.png',
      relativePath: 'user123.png',
    });
    expect(await readFile(path.join(rootDir, 'user123.png'), 'utf-8')).toBe(
      'fake-png',
    );
  });

  it('names a banner as <userId>-banner.<ext>', async () => {
    const storage = createDiskMediaStorage({ rootDir });

    const saved = await storage.saveAsset({
      userId: 'user123',
      kind: 'banner',
      buffer: Buffer.from('fake-jpg'),
      extension: 'jpg',
    });

    expect(saved.fileName).toBe('user123-banner.jpg');
  });

  it('overwrites a prior upload and removes the stale file when the extension changes', async () => {
    const storage = createDiskMediaStorage({ rootDir });

    await storage.saveAsset({
      userId: 'user123',
      kind: 'avatar',
      buffer: Buffer.from('v1'),
      extension: 'png',
    });
    await storage.saveAsset({
      userId: 'user123',
      kind: 'avatar',
      buffer: Buffer.from('v2'),
      extension: 'webp',
    });

    const entries = await readdir(rootDir);
    expect(entries).toEqual(['user123.webp']);
    expect(await readFile(path.join(rootDir, 'user123.webp'), 'utf-8')).toBe(
      'v2',
    );
  });

  it('does not disturb a banner upload when overwriting an avatar for the same user', async () => {
    const storage = createDiskMediaStorage({ rootDir });

    await storage.saveAsset({
      userId: 'user123',
      kind: 'avatar',
      buffer: Buffer.from('a1'),
      extension: 'png',
    });
    await storage.saveAsset({
      userId: 'user123',
      kind: 'banner',
      buffer: Buffer.from('b1'),
      extension: 'png',
    });
    await storage.saveAsset({
      userId: 'user123',
      kind: 'avatar',
      buffer: Buffer.from('a2'),
      extension: 'webp',
    });

    const entries = (await readdir(rootDir)).sort();
    expect(entries).toEqual(['user123-banner.png', 'user123.webp']);
  });
});
