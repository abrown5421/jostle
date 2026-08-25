import { cn } from '@jostle/ui';

export interface StatusBadgeProps {
  readonly connected: boolean;
}

export function StatusBadge({ connected }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-2.5 py-1 text-xs font-medium text-content-secondary">
      <span
        className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-status-online' : 'bg-status-offline')}
        aria-hidden="true"
      />
      {connected ? 'Connected' : 'Not Connected'}
    </span>
  );
}
