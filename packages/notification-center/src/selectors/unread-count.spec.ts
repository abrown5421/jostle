import { describe, expect, it } from 'vitest';
import { selectUnreadCount } from './unread-count.js';
import type { NotificationItem } from '../types/index.js';

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return { id: '1', type: 'example', readStatus: false, payload: {}, createdAt: '2026-01-01T00:00:00.000Z', ...overrides };
}

describe('selectUnreadCount', () => {
  it('counts only unread items', () => {
    const items = [item({ id: '1', readStatus: false }), item({ id: '2', readStatus: true }), item({ id: '3', readStatus: false })];
    expect(selectUnreadCount(items)).toBe(2);
  });

  it('returns 0 for an empty list', () => {
    expect(selectUnreadCount([])).toBe(0);
  });

  it('returns 0 when everything is read', () => {
    expect(selectUnreadCount([item({ readStatus: true })])).toBe(0);
  });
});
