import type { NotificationItem } from '../types/index.js';

export interface FetchNotificationsInput {
  readonly recipientId: string;
  readonly before?: string;
}

export interface FetchNotificationsResult {
  readonly items: ReadonlyArray<NotificationItem>;
  readonly nextCursor: string | null;
}

export interface MarkNotificationsInput {
  readonly recipientId: string;
  readonly ids: ReadonlyArray<string>;
}

export interface NotificationCenterClient {
  readonly fetchNotifications: (input: FetchNotificationsInput) => Promise<FetchNotificationsResult>;
  readonly markAsRead: (input: MarkNotificationsInput) => Promise<void>;
  readonly markAllAsRead: (input: { recipientId: string }) => Promise<void>;
}
