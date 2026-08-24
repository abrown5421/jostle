import { memo } from 'react';
import { cn } from '@jostle/ui';
import { PresenceLight } from '../presence-light/index.js';
import type { PresenceLightSize } from '../presence-light/index.js';
import type { AvatarProps, AvatarSize } from './types.js';

const AVATAR_SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const INDICATOR_SIZE_BY_AVATAR_SIZE: Record<AvatarSize, PresenceLightSize> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

function initialsFromName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export const Avatar = memo(function Avatar({ name, imageUrl, status, size = 'md', className }: AvatarProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', AVATAR_SIZE_CLASS[size], className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          role="img"
          aria-label={name}
          className="flex h-full w-full items-center justify-center rounded-full bg-primary"
        >
          {initialsFromName(name)}
        </span>
      )}
      {status ? (
        <span className="absolute bottom-0 right-0 inline-flex">
          <PresenceLight status={status} size={INDICATOR_SIZE_BY_AVATAR_SIZE[size]} />
        </span>
      ) : null}
    </span>
  );
});
