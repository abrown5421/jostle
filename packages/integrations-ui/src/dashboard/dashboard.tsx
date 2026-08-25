import { Container, Text } from '@jostle/ui';
import { useState } from 'react';
import { useIntegrations } from '../hook/index.js';
import { ProviderCard } from '../provider-card/index.js';
import type { IntegrationsClient } from '../client/index.js';

export interface IntegrationsDashboardProps {
  readonly client: IntegrationsClient;
}

export function IntegrationsDashboard({ client }: IntegrationsDashboardProps) {
  const { integrations, isLoading, disconnect } = useIntegrations({ client });
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);

  const handleDisconnect = async (provider: string) => {
    setDisconnectingProvider(provider);
    try {
      await disconnect(provider);
    } finally {
      setDisconnectingProvider(null);
    }
  };

  if (isLoading) {
    return <Text textColor="content-secondary">Loading connected accounts…</Text>;
  }

  if (integrations.length === 0) {
    return <Text textColor="content-secondary">No integrations are available yet.</Text>;
  }

  return (
    <Container direction="col" gap={3} className="w-full">
      {integrations.map((integration) => (
        <ProviderCard
          key={integration.provider}
          integration={integration}
          onDisconnect={handleDisconnect}
          isDisconnecting={disconnectingProvider === integration.provider}
        />
      ))}
    </Container>
  );
}
