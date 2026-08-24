import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { toPublicNotification } from './to-public.js';

describe('toPublicNotification', () => {
  it('converts ObjectIds and Dates to their string forms', () => {
    const recipientId = new ObjectId();
    const id = new ObjectId();
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const result = toPublicNotification({
      _id: id,
      recipientId,
      type: 'friend_request',
      readStatus: false,
      payload: { initiatorId: 'a', targetId: 'b' },
      createdAt,
    });

    expect(result).toEqual({
      id: id.toString(),
      recipientId: recipientId.toString(),
      type: 'friend_request',
      readStatus: false,
      payload: { initiatorId: 'a', targetId: 'b' },
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
