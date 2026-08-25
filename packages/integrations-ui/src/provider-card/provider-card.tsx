import { Avatar, Button, Container, Text } from '@jostle/ui';
import { StatusBadge } from '../status-badge/index.js';
import type { IntegrationStatus } from '../client/index.js';

export interface ProviderCardProps {
  readonly integration: IntegrationStatus;
  readonly onDisconnect: (provider: string) => void;
  readonly isDisconnecting?: boolean;
}

function readStringField(
  metadata: Readonly<Record<string, unknown>> | undefined,
  field: string,
): string | undefined {
  const value = metadata?.[field];
  return typeof value === 'string' ? value : undefined;
}

export function ProviderCard({ integration, onDisconnect, isDisconnecting }: ProviderCardProps) {
  const connectedAccountName = readStringField(integration.metadata, 'displayName');
  const connectedAvatarUrl = readStringField(integration.metadata, 'profileImageUrl');

  return (
    <Container
      direction="row"
      horizontalAlign="between"
      verticalAlign="center"
      gap={4}
      padding={4}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full flex-wrap rounded-lg border"
    >
      <Container direction="row" gap={3} verticalAlign="center">
        <Avatar
          imageUrl={connectedAvatarUrl ?? integration.logoUrl}
          name={connectedAccountName ?? integration.displayName}
          size="sm"
        />
        <Container direction="col" gap={1}>
          <Text fontWeight="semibold" textColor="content-primary">
            {integration.displayName}
          </Text>
          {integration.connected && connectedAccountName ? (
            <Text fontSize="sm" textColor="content-secondary">
              {connectedAccountName}
            </Text>
          ) : null}
        </Container>
      </Container>

      <Container direction="row" gap={3} verticalAlign="center">
        <StatusBadge connected={integration.connected} />
        {integration.connected ? (
          <Button
            variant="outlined"
            color="secondary"
            disabled={isDisconnecting}
            onClick={() => onDisconnect(integration.provider)}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            color="primary"
            onClick={() => {
              window.location.href = `/auth/${integration.provider.toLowerCase()}/connect`;
            }}
          >
            Connect
          </Button>
        )}
      </Container>
    </Container>
  );
}
