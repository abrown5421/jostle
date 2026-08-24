import { useEffect, useState } from 'react';
import { presenceTopic, subscribeTopic } from '@jostle/messaging';
import type { PresenceStatus, PubSub } from '@jostle/messaging';

export interface UsePresenceStatusOptions {
  readonly pubsub: PubSub;
  readonly entityId: string;
}

export function usePresenceStatus({ pubsub, entityId }: UsePresenceStatusOptions): PresenceStatus {
  const [status, setStatus] = useState<PresenceStatus>('offline');

  useEffect(() => {
    setStatus('offline');
    return subscribeTopic(pubsub, presenceTopic, { entityId }, (envelope) => {
      setStatus(envelope.payload.status);
    });
  }, [pubsub, entityId]);

  return status;
}
