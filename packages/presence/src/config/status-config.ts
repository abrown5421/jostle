import type { PresenceStatus } from '@jostle/messaging';
import type { StatusIndicatorConfig } from './types.js';

export const IDLE_THRESHOLD_MS = 10 * 60 * 1000;

export const STATUS_INDICATOR_CONFIG: Readonly<Record<PresenceStatus, StatusIndicatorConfig>> = {
  online: {
    label: 'Online',
    description: 'Authenticated and active within the last 10 minutes.',
    indicatorClassName: 'bg-status-online',
  },
  away: {
    label: 'Away',
    description: 'Authenticated and inactive for 10 minutes or more.',
    indicatorClassName: 'bg-status-away',
  },
  busy: {
    label: 'Busy',
    description: 'Reserved for an active game session.',
    indicatorClassName: 'bg-status-busy',
  },
  offline: {
    label: 'Offline',
    description: 'Unauthenticated or disconnected.',
    indicatorClassName: 'bg-status-offline',
  },
};
