import type { Asset } from '@inithium/types';

export const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_ORIGIN) ||
  'http://localhost:3000';

export const PAGE_SIZE = 16;

export const getProxyUrl = (asset: Asset): string =>
  `${API_BASE}/api/assets/by-key/${asset.storage_key}`;

export interface SettingItem {
  _id: string;
  key: string;
  value: string | boolean | number;
  description?: string;
  is_public: boolean;
}