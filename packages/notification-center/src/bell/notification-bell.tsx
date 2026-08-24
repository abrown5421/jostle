import { memo } from 'react';
import { cn } from '@jostle/ui';
import type { NotificationBellProps } from './types.js';

const BADGE_CLASS =
  'absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-status-busy px-1 text-[0.65rem] font-semibold leading-none text-primary-foreground';

function BellIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3a6 6 0 0 0-6 6v3.5c0 .74-.29 1.45-.8 1.98L4 15.7c-.6.62-.17 1.68.7 1.68h14.6c.87 0 1.3-1.06.7-1.68l-1.2-1.22a2.8 2.8 0 0 1-.8-1.98V9a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export const NotificationBell = memo(function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="flex h-9 w-9 items-center justify-center rounded-full text-content-primary transition-colors hover:bg-surface-tertiary"
      >
        <BellIcon className="h-5 w-5" />
      </button>
      {hasUnread ? (
        <span className={BADGE_CLASS} aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </span>
  );
});
