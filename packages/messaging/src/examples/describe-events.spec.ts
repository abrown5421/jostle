import { describe, expect, it } from 'vitest';
import { describeNotificationEvent, describePresenceEvent, describeSessionEvent } from './describe-events.js';

describe('describe-events', () => {
  it('describes a presence event', () => {
    expect(
      describePresenceEvent({
        id: '1',
        topic: 'presence:user-1',
        timestamp: 0,
        meta: {},
        payload: { entityId: 'user-1', status: 'online', timestamp: 0 },
      })
    ).toBe('presence:user-1 is now online');
  });

  it('describes a notification event', () => {
    expect(
      describeNotificationEvent({
        id: '1',
        topic: 'user:user-1:notifications',
        timestamp: 0,
        meta: {},
        payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
      })
    ).toBe('notification request_sent from user-2 to user-1');
  });

  it('describes a session event', () => {
    expect(
      describeSessionEvent({
        id: '1',
        topic: 'session:session-42',
        timestamp: 0,
        meta: {},
        payload: {
          kind: 'state_sync',
          tick: 1,
          scope: 'player',
          host: { nodeId: 'node-a', metadata: {} },
          data: {},
        },
      })
    ).toBe('session tick 1: state_sync (player)');
  });
});
