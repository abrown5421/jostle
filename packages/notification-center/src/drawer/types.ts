import type { ReactNode } from 'react';
import type { NotificationItem } from '../types/index.js';

export interface NotificationDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly notifications: ReadonlyArray<NotificationItem>;
  readonly onMarkAsRead: (ids: ReadonlyArray<string>) => void;
  readonly onMarkAllAsRead: () => void;
  readonly hasMore?: boolean;
  readonly onLoadMore?: () => void;
  readonly renderPayload?: (notification: NotificationItem) => ReactNode;
}
