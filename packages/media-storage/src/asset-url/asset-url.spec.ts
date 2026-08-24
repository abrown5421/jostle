import { describe, expect, it } from 'vitest';
import {
  isAbsoluteUrl,
  resolveAssetUrl,
  resolveStoredMediaUrl,
} from './asset-url.js';

describe('isAbsoluteUrl', () => {
  it('recognizes http and https URLs', () => {
    expect(isAbsoluteUrl('https://example.com/a.png')).toBe(true);
    expect(isAbsoluteUrl('http://example.com/a.png')).toBe(true);
  });

  it('rejects relative paths', () => {
    expect(isAbsoluteUrl('user123.png')).toBe(false);
    expect(isAbsoluteUrl('/uploads/user123.png')).toBe(false);
  });
});

describe('resolveAssetUrl', () => {
  it('joins the base URL, media prefix, and relative path', () => {
    expect(resolveAssetUrl('user123.png', 'http://localhost:3333')).toBe(
      'http://localhost:3333/uploads/user123.png',
    );
  });

  it('normalizes duplicate slashes at the join points', () => {
    expect(resolveAssetUrl('/user123.png', 'http://localhost:3333/')).toBe(
      'http://localhost:3333/uploads/user123.png',
    );
  });
});

describe('resolveStoredMediaUrl', () => {
  it('returns undefined when nothing is stored', () => {
    expect(
      resolveStoredMediaUrl(undefined, 'http://localhost:3333'),
    ).toBeUndefined();
  });

  it('passes an already-absolute URL through unchanged', () => {
    expect(
      resolveStoredMediaUrl(
        'https://cdn.example.com/a.png',
        'http://localhost:3333',
      ),
    ).toBe('https://cdn.example.com/a.png');
  });

  it('expands a stored internal path into a fully qualified URL', () => {
    expect(resolveStoredMediaUrl('user123.png', 'http://localhost:3333')).toBe(
      'http://localhost:3333/uploads/user123.png',
    );
  });
});
