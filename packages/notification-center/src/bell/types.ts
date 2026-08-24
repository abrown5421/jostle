export interface NotificationBellProps {
  readonly unreadCount: number;
  readonly onClick: () => void;
  readonly className?: string;
}
