import type { NotificationItem } from '../types/index.js';

export function selectChronological(items: ReadonlyArray<NotificationItem>): ReadonlyArray<NotificationItem> {
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}
