import { describe, expect, it } from 'vitest';
import { INITIAL_NOTIFICATIONS_STATE, notificationsReducer } from './notifications-reducer.js';
import type { NotificationsState } from './notifications-reducer.js';
import type { NotificationItem } from '../types/index.js';

function item(id: string, readStatus = false): NotificationItem {
  return { id, type: 'example', readStatus, payload: {}, createdAt: '2026-01-01T00:00:00.000Z' };
}

describe('notificationsReducer', () => {
  it('appends a received page and stores its cursor', () => {
    const state = notificationsReducer(INITIAL_NOTIFICATIONS_STATE, {
      kind: 'received_page',
      items: [item('1'), item('2')],
      nextCursor: 'cursor-1',
    });

    expect(state.items.map((entry) => entry.id)).toEqual(['1', '2']);
    expect(state.nextCursor).toBe('cursor-1');
  });

  it('prepends a live item without disturbing the cursor', () => {
    const seeded: NotificationsState = { items: [item('1')], nextCursor: 'cursor-1' };
    const state = notificationsReducer(seeded, { kind: 'received_live', item: item('2') });

    expect(state.items.map((entry) => entry.id)).toEqual(['2', '1']);
    expect(state.nextCursor).toBe('cursor-1');
  });

  it('marks only the given ids as read', () => {
    const seeded: NotificationsState = { items: [item('1'), item('2'), item('3')], nextCursor: null };
    const state = notificationsReducer(seeded, { kind: 'marked_read', ids: ['1', '3'] });

    expect(state.items.map((entry) => [entry.id, entry.readStatus])).toEqual([
      ['1', true],
      ['2', false],
      ['3', true],
    ]);
  });

  it('marks every item as read', () => {
    const seeded: NotificationsState = { items: [item('1'), item('2', true)], nextCursor: null };
    const state = notificationsReducer(seeded, { kind: 'marked_all_read' });

    expect(state.items.every((entry) => entry.readStatus)).toBe(true);
  });

  it('does not mutate the previous state object', () => {
    const seeded: NotificationsState = { items: [item('1')], nextCursor: null };
    const state = notificationsReducer(seeded, { kind: 'marked_all_read' });

    expect(state).not.toBe(seeded);
    expect(seeded.items[0]?.readStatus).toBe(false);
  });
});
