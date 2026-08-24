import { describe, expect, it } from 'vitest';
import { selectChronological } from './chronological.js';
import type { NotificationItem } from '../types/index.js';

function item(id: string, createdAt: string): NotificationItem {
  return { id, type: 'example', readStatus: false, payload: {}, createdAt };
}

describe('selectChronological', () => {
  it('orders items newest first regardless of input order', () => {
    const items = [item('a', '2026-01-01T00:00:00.000Z'), item('b', '2026-01-03T00:00:00.000Z'), item('c', '2026-01-02T00:00:00.000Z')];

    expect(selectChronological(items).map((entry) => entry.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const items = [item('a', '2026-01-01T00:00:00.000Z'), item('b', '2026-01-02T00:00:00.000Z')];
    const original = [...items];

    selectChronological(items);

    expect(items).toEqual(original);
  });
});
