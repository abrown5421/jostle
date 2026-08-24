import type { PresenceStatus } from '@jostle/messaging';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  readonly name: string;
  readonly imageUrl?: string;
  readonly status?: PresenceStatus;
  readonly size?: AvatarSize;
  readonly className?: string;
}
