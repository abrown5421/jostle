import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getClient', () => {
  const originalUri = process.env.MONGO_URI;

  afterEach(() => {
    process.env.MONGO_URI = originalUri;
    vi.resetModules();
  });

  it('throws when MONGO_URI is not set', async () => {
    delete process.env.MONGO_URI;
    const { getClient } = await import('./client.js');

    expect(() => getClient()).toThrow('MONGO_URI environment variable is not set');
  });

  it('returns the same client instance across calls (singleton, not one client per call)', async () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    const { getClient } = await import('./client.js');

    expect(getClient()).toBe(getClient());
  });
});
