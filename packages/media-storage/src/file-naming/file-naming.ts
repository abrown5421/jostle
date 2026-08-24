export type MediaAssetKind = 'avatar' | 'banner';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function isSupportedImageMimeType(mimeType: string): boolean {
  return mimeType.toLowerCase() in MIME_EXTENSIONS;
}

export function resolveExtensionFromMimeType(
  mimeType: string,
): string | undefined {
  return MIME_EXTENSIONS[mimeType.toLowerCase()];
}

function suffixForKind(kind: MediaAssetKind): string {
  return kind === 'banner' ? '-banner' : '';
}

export function resolveMediaFileName(
  kind: MediaAssetKind,
  userId: string,
  extension: string,
): string {
  return `${userId}${suffixForKind(kind)}.${extension}`;
}

export function isMediaFileForUser(
  kind: MediaAssetKind,
  userId: string,
  fileName: string,
): boolean {
  return fileName.startsWith(`${userId}${suffixForKind(kind)}.`);
}
