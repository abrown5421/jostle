import { describe, expect, it } from 'vitest';
import { isValidRemoteImageUrl } from './validation.js';

describe('isValidRemoteImageUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidRemoteImageUrl('https://example.com/a.png')).toBe(true);
    expect(isValidRemoteImageUrl('http://example.com/a.png')).toBe(true);
  });

  it('rejects non-http(s) protocols', () => {
    expect(isValidRemoteImageUrl('javascript:alert(1)')).toBe(false);
    expect(isValidRemoteImageUrl('ftp://example.com/a.png')).toBe(false);
  });

  it('rejects relative paths and malformed URLs', () => {
    expect(isValidRemoteImageUrl('user123.png')).toBe(false);
    expect(isValidRemoteImageUrl('not a url')).toBe(false);
  });
});
