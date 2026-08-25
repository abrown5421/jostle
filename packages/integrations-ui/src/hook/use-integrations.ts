import { useCallback, useEffect, useState } from 'react';
import type { IntegrationsClient, IntegrationStatus } from '../client/index.js';

export interface UseIntegrationsOptions {
  readonly client: IntegrationsClient;
}

export interface UseIntegrationsResult {
  readonly integrations: readonly IntegrationStatus[];
  readonly isLoading: boolean;
  readonly disconnect: (provider: string) => Promise<void>;
}

export function useIntegrations({ client }: UseIntegrationsOptions): UseIntegrationsResult {
  const [integrations, setIntegrations] = useState<readonly IntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client
      .listIntegrations()
      .then((result) => {
        if (!cancelled) setIntegrations(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const disconnect = useCallback(
    async (provider: string) => {
      await client.disconnectIntegration(provider);
      setIntegrations(await client.listIntegrations());
    },
    [client],
  );

  return { integrations, isLoading, disconnect };
}
