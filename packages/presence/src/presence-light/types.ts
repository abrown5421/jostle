import type { PresenceStatus } from '@jostle/messaging';

export type PresenceLightSize = 'sm' | 'md' | 'lg';

export interface PresenceLightProps {
  readonly status: PresenceStatus;
  readonly size?: PresenceLightSize;
  readonly className?: string;
}
