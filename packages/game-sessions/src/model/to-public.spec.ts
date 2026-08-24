import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { toPublicSession, toPublicSessionPlayer } from './to-public.js';

describe('toPublicSession', () => {
  it('converts ObjectIds and Dates to their string forms', () => {
    const id = new ObjectId();
    const hostUserId = new ObjectId();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    expect(toPublicSession({ _id: id, joinCode: 'ABC123', hostUserId, status: 'lobby', createdAt })).toEqual({
      sessionId: id.toString(),
      joinCode: 'ABC123',
      hostUserId: hostUserId.toString(),
      status: 'lobby',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('toPublicSessionPlayer', () => {
  it('converts an authenticated player, preserving a real userId', () => {
    const id = new ObjectId();
    const sessionId = new ObjectId();
    const userId = new ObjectId();
    const joinedAt = new Date('2026-01-01T00:00:00.000Z');

    expect(
      toPublicSessionPlayer({ _id: id, sessionId, userId, displayName: 'Ada', avatarUrl: 'https://example.com/a.png', joinedAt })
    ).toEqual({
      playerId: id.toString(),
      sessionId: sessionId.toString(),
      userId: userId.toString(),
      displayName: 'Ada',
      avatarUrl: 'https://example.com/a.png',
      joinedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('converts a guest player, preserving null userId', () => {
    const id = new ObjectId();
    const sessionId = new ObjectId();
    const joinedAt = new Date('2026-01-01T00:00:00.000Z');

    const result = toPublicSessionPlayer({ _id: id, sessionId, userId: null, displayName: 'Guest', joinedAt });

    expect(result.userId).toBeNull();
    expect(result.avatarUrl).toBeUndefined();
  });
});
