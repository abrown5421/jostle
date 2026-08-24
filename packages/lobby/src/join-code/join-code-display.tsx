import { cn } from '@jostle/ui';
import type { JoinCodeDisplayProps } from './types.js';

export function JoinCodeDisplay({ joinCode, className }: JoinCodeDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className="text-sm font-medium text-content-secondary">Join Code</span>
      <span className="text-4xl font-bold tracking-[0.3em] text-content-primary">{joinCode}</span>
    </div>
  );
}
