export const MEDIA_URL_PREFIX = 'uploads';

export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function resolveAssetUrl(relativePath: string, baseUrl: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = relativePath.replace(/^\/+/, '');
  return `${normalizedBase}/${MEDIA_URL_PREFIX}/${normalizedPath}`;
}

export function resolveStoredMediaUrl(
  storedValue: string | undefined,
  baseUrl: string,
): string | undefined {
  if (!storedValue) return undefined;
  return isAbsoluteUrl(storedValue)
    ? storedValue
    : resolveAssetUrl(storedValue, baseUrl);
}
