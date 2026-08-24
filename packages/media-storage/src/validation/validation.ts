import { isAbsoluteUrl } from '../asset-url/index.js';

export function isValidRemoteImageUrl(value: string): boolean {
  if (!isAbsoluteUrl(value)) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
