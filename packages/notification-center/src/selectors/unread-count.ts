import type { NotificationItem } from '../types/index.js';

export function selectUnreadCount(items: ReadonlyArray<NotificationItem>): number {
  return items.reduce((count, item) => (item.readStatus ? count : count + 1), 0);
}
