import { Button, cn, Drawer } from '@jostle/ui';
import type { ReactNode } from 'react';
import type { NotificationItem } from '../types/index.js';
import type { NotificationDrawerProps } from './types.js';

function humanizeType(type: string): string {
  const spaced = type.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatRelativeTime(createdAt: string): string {
  const diffMinutes = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function NotificationRow({
  notification,
  onMarkAsRead,
  renderPayload,
}: {
  readonly notification: NotificationItem;
  readonly onMarkAsRead: (ids: ReadonlyArray<string>) => void;
  readonly renderPayload?: (notification: NotificationItem) => ReactNode;
}) {
  return (
    <li
      className={cn(
        'flex items-start justify-between gap-3 rounded-md border border-surface-tertiary p-3',
        notification.readStatus ? 'bg-transparent' : 'bg-surface-tertiary/40',
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-content-primary">
          {renderPayload ? renderPayload(notification) : humanizeType(notification.type)}
        </span>
        <span className="text-xs text-content-tertiary">{formatRelativeTime(notification.createdAt)}</span>
      </div>
      {!notification.readStatus && (
        <button
          type="button"
          onClick={() => onMarkAsRead([notification.id])}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          Mark read
        </button>
      )}
    </li>
  );
}

export function NotificationDrawer({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  hasMore = false,
  onLoadMore,
  renderPayload,
}: NotificationDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} header={<p className="text-sm font-medium text-content-secondary">Notifications</p>}>
      {notifications.length > 0 && (
        <Button variant="link" onClick={onMarkAllAsRead} className="self-start">
          Mark all as read
        </Button>
      )}

      {notifications.length === 0 ? (
        <p className="text-sm text-content-tertiary">You&apos;re all caught up.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} renderPayload={renderPayload} />
          ))}
        </ul>
      )}

      {hasMore && onLoadMore && (
        <Button variant="link" onClick={onLoadMore} className="self-center">
          Load more
        </Button>
      )}
    </Drawer>
  );
}
