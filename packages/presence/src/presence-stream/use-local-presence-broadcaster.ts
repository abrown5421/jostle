import { useEffect, useRef } from 'react';
import { presenceTopic, publishTopic } from '@jostle/messaging';
import type { PresenceStatus, PubSub } from '@jostle/messaging';
import { IDLE_THRESHOLD_MS } from '../config/index.js';
import { useIdleTimer } from '../idle-detection/index.js';
import { deriveStatus } from './derive-status.js';

export interface UseLocalPresenceBroadcasterOptions {
  readonly pubsub: PubSub;
  readonly entityId: string;
  readonly isAuthenticated: boolean;
  readonly isInActiveSession?: boolean;
  readonly idleThresholdMs?: number;
}

export function useLocalPresenceBroadcaster(options: UseLocalPresenceBroadcasterOptions): PresenceStatus {
  const {
    pubsub,
    entityId,
    isAuthenticated,
    isInActiveSession = false,
    idleThresholdMs = IDLE_THRESHOLD_MS,
  } = options;

  const isIdle = useIdleTimer(idleThresholdMs);
  const status = deriveStatus({ isAuthenticated, isIdle, isInActiveSession });
  const previousStatusRef = useRef<PresenceStatus | undefined>(undefined);

  useEffect(() => {
    if (previousStatusRef.current === status) return;
    previousStatusRef.current = status;
    publishTopic(pubsub, presenceTopic, {
      params: { entityId },
      payload: { entityId, status, timestamp: Date.now() },
    });
  }, [pubsub, entityId, status]);

  return status;
}
