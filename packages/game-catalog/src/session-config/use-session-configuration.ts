import { sessionConfigTopic, subscribeTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useEffect, useState } from 'react';
import type { SessionConfigurationClient, SessionConfigurationSnapshot } from './types.js';

export interface UseSessionConfigurationOptions {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly client: SessionConfigurationClient;
}

export interface UseSessionConfigurationResult {
  readonly configuration: SessionConfigurationSnapshot | null;
  readonly isLoading: boolean;
}

export function useSessionConfiguration(options: UseSessionConfigurationOptions): UseSessionConfigurationResult {
  const { pubsub, sessionId, client } = options;
  const [configuration, setConfiguration] = useState<SessionConfigurationSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client.getSessionConfiguration(sessionId).then((result) => {
      if (cancelled) return;
      setConfiguration(result);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId]);

  useEffect(
    () =>
      subscribeTopic(pubsub, sessionConfigTopic, { sessionId }, (envelope) => {
        setConfiguration({ gameId: envelope.payload.gameId, selectedSettings: envelope.payload.selectedSettings });
      }),
    [pubsub, sessionId]
  );

  return { configuration, isLoading };
}
