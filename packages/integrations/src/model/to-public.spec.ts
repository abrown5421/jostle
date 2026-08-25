import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { toPublicConnectedIntegration, toPublicUnconnectedIntegration } from './to-public.js';
import type { UserIntegrationDocument } from './types.js';

const PROVIDER_INFO = { displayName: 'Spotify', logoUrl: 'https://example.com/spotify.svg' };

describe('toPublicConnectedIntegration', () => {
  it('strips tokens and shapes a connected status', () => {
    const document: UserIntegrationDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      provider: 'SPOTIFY',
      providerAccountId: 'spotify-user-1',
      accessToken: 'encrypted-access',
      refreshToken: 'encrypted-refresh',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      scopes: ['user-read-email'],
      metadata: { displayName: 'DJ Test' },
      createdAt: new Date('2025-12-01T00:00:00.000Z'),
      updatedAt: new Date('2025-12-01T00:00:00.000Z'),
    };

    const result = toPublicConnectedIntegration(document, PROVIDER_INFO);

    expect(result).toEqual({
      displayName: 'Spotify',
      logoUrl: 'https://example.com/spotify.svg',
      provider: 'SPOTIFY',
      connected: true,
      providerAccountId: 'spotify-user-1',
      scopes: ['user-read-email'],
      metadata: { displayName: 'DJ Test' },
      connectedAt: '2025-12-01T00:00:00.000Z',
    });
    expect(result).not.toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('refreshToken');
  });
});

describe('toPublicUnconnectedIntegration', () => {
  it('shapes a not-connected status', () => {
    expect(toPublicUnconnectedIntegration('SPOTIFY', PROVIDER_INFO)).toEqual({
      displayName: 'Spotify',
      logoUrl: 'https://example.com/spotify.svg',
      provider: 'SPOTIFY',
      connected: false,
    });
  });
});
