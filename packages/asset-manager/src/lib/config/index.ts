import path from 'node:path';
import type { FileCategory } from '../types/index.js';

export const ASSETS_ROOT: string = process.env['ASSETS_ROOT']
  ? path.resolve(process.env['ASSETS_ROOT'])
  : path.resolve(process.cwd(), 'apps', 'api', 'src', 'assets');

export const TRASH_ROOT = path.join(ASSETS_ROOT, '.trash');

export const TOKEN_TTL_MS = 15 * 60 * 1_000;

export const PRESIGNED_PATH_PREFIX = '/presigned';

const MIME_TO_CATEGORY: Record<string, FileCategory> = {
  'image/jpeg': 'images',
  'image/png': 'images',
  'image/gif': 'images',
  'image/webp': 'images',
  'image/svg+xml': 'images',
  'image/avif': 'images',
  'image/bmp': 'images',
  'image/tiff': 'images',

  'font/ttf': 'fonts',
  'font/sfnt': 'fonts',
  'font/otf': 'fonts',
  'font/woff': 'fonts',
  'font/woff2': 'fonts',
  'application/font-woff': 'fonts',
  'application/font-woff2': 'fonts',
  'application/x-font-ttf': 'fonts',
  'application/x-font-opentype': 'fonts',

  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',

  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/ogg': 'videos',

  'application/pdf': 'documents',
  'text/plain': 'documents',
  'application/msword': 'documents',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
  'application/vnd.ms-excel': 'documents',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'documents',
};

const FILE_CATEGORY_TO_SCHEMA: Record<FileCategory, string> = {
  images: 'image',
  fonts: 'font',
  audio: 'audio',
  videos: 'other',
  documents: 'document',
  misc: 'other',
};

const EXT_TO_CATEGORY: Record<string, FileCategory> = {
  '.ttf': 'fonts',
  '.otf': 'fonts',
  '.woff': 'fonts',
  '.woff2': 'fonts',
};

export const resolveCategory = (mimeType: string, originalName?: string): FileCategory => {
  if (MIME_TO_CATEGORY[mimeType]) return MIME_TO_CATEGORY[mimeType];
  if (originalName) {
    const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase();
    if (EXT_TO_CATEGORY[ext]) return EXT_TO_CATEGORY[ext];
  }
  return 'misc';
};

export const toSchemaCategory = (category: FileCategory): string =>
  FILE_CATEGORY_TO_SCHEMA[category];

export const categoryDir = (
  category: FileCategory,
  ownerType: 'app' | 'user',
  ownerId: string | null,
): string => {
  const ownerSegment =
    ownerType === 'user' && ownerId ? path.join('user', ownerId) : 'app';
  return path.join(ASSETS_ROOT, category, ownerSegment);
};

export const trashDir = (
  category: FileCategory,
  ownerType: 'app' | 'user',
  ownerId: string | null,
): string => {
  const ownerSegment =
    ownerType === 'user' && ownerId ? path.join('user', ownerId) : 'app';
  return path.join(TRASH_ROOT, category, ownerSegment);
};

export const buildAbsolutePath = (
  category: FileCategory,
  storageKey: string,
  ownerType: 'app' | 'user',
  ownerId: string | null,
): string => path.join(categoryDir(category, ownerType, ownerId), storageKey);

export const buildTrashPath = (
  category: FileCategory,
  storageKey: string,
  ownerType: 'app' | 'user',
  ownerId: string | null,
): string => path.join(trashDir(category, ownerType, ownerId), storageKey);
