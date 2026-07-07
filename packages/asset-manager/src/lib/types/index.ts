export type FileCategory =
  | 'images'
  | 'fonts'
  | 'videos'
  | 'audio'
  | 'documents'
  | 'misc';

export type StorageKey = string;

export interface UploadToken {
  uploadId: string;
  storageKey: StorageKey;
  mimeType: string;
  originalName: string;
  size: number;
  expiresAt: number;
  ownerType: 'app' | 'user';
  ownerId: string | null;
}

export interface FileMetadata {
  storageKey: StorageKey;
  category: FileCategory;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  absolutePath: string;
  ownerType: 'app' | 'user';
  ownerId: string | null;
}

export interface AdapterResult<T> {
  ok: true;
  data: T;
}

export interface AdapterError {
  ok: false;
  error: string;
  code: string;
}

export type AdapterOutcome<T> = AdapterResult<T> | AdapterError;

export interface ProxyTarget {
  absolutePath: string;
  mimeType: string;
  storageKey: StorageKey;
}
