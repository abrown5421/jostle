import type { PresenceStatus } from '@jostle/messaging';

export interface DeriveStatusInput {
  readonly isAuthenticated: boolean;
  readonly isIdle: boolean;
  readonly isInActiveSession?: boolean;
}

export function deriveStatus(input: DeriveStatusInput): PresenceStatus {
  if (!input.isAuthenticated) return 'offline';
  if (input.isInActiveSession) return 'busy';
  if (input.isIdle) return 'away';
  return 'online';
}
