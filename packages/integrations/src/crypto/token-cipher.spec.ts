import { randomBytes } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { decryptToken, encryptToken } from './token-cipher.js';

describe('token-cipher', () => {
  beforeAll(() => {
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  it('round-trips a plaintext token through encrypt/decrypt', () => {
    const plainText = 'BQD3xyz-some-spotify-access-token';
    const encrypted = encryptToken(plainText);
    expect(encrypted).not.toEqual(plainText);
    expect(decryptToken(encrypted)).toEqual(plainText);
  });

  it('produces a different ciphertext each time via a random iv', () => {
    const plainText = 'same-token-value';
    expect(encryptToken(plainText)).not.toEqual(encryptToken(plainText));
  });

  it('throws when the packed value is malformed', () => {
    expect(() => decryptToken('not-a-valid-packed-token')).toThrow();
  });
});
