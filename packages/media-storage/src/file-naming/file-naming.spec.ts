import { describe, expect, it } from 'vitest';
import {
  isMediaFileForUser,
  isSupportedImageMimeType,
  resolveExtensionFromMimeType,
  resolveMediaFileName,
} from './file-naming.js';

describe('resolveExtensionFromMimeType', () => {
  it('maps known image mime types to their extension', () => {
    expect(resolveExtensionFromMimeType('image/png')).toBe('png');
    expect(resolveExtensionFromMimeType('image/jpeg')).toBe('jpg');
    expect(resolveExtensionFromMimeType('IMAGE/WEBP')).toBe('webp');
  });

  it('returns undefined for an unsupported mime type', () => {
    expect(resolveExtensionFromMimeType('application/pdf')).toBeUndefined();
  });
});

describe('isSupportedImageMimeType', () => {
  it('accepts supported image types and rejects everything else', () => {
    expect(isSupportedImageMimeType('image/png')).toBe(true);
    expect(isSupportedImageMimeType('text/html')).toBe(false);
  });
});

describe('resolveMediaFileName', () => {
  it('names an avatar file after the bare user id', () => {
    expect(resolveMediaFileName('avatar', 'user123', 'png')).toBe(
      'user123.png',
    );
  });

  it('names a banner file with a -banner suffix', () => {
    expect(resolveMediaFileName('banner', 'user123', 'jpg')).toBe(
      'user123-banner.jpg',
    );
  });
});

describe('isMediaFileForUser', () => {
  it('matches an avatar file for the given user regardless of extension', () => {
    expect(isMediaFileForUser('avatar', 'user123', 'user123.png')).toBe(true);
    expect(isMediaFileForUser('avatar', 'user123', 'user123.webp')).toBe(true);
  });

  it('does not match another user id sharing a prefix', () => {
    expect(isMediaFileForUser('avatar', 'user1', 'user123.png')).toBe(false);
  });

  it('does not confuse a banner file for an avatar match', () => {
    expect(isMediaFileForUser('avatar', 'user123', 'user123-banner.png')).toBe(
      false,
    );
  });

  it('matches a banner file only for the banner kind', () => {
    expect(isMediaFileForUser('banner', 'user123', 'user123-banner.png')).toBe(
      true,
    );
    expect(isMediaFileForUser('avatar', 'user123', 'user123-banner.png')).toBe(
      false,
    );
  });
});
