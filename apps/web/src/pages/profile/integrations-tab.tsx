import {
  ConnectionFeedbackBanner,
  IntegrationsDashboard,
} from '@jostle/integrations-ui';
import { Container } from '@jostle/ui';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { integrationsClient } from '../../integrations/integrations-client.js';

function toDisplayName(providerId: string): string {
  return providerId.charAt(0) + providerId.slice(1).toLowerCase();
}

export function IntegrationsTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('integrationStatus');
  const status = rawStatus === 'connected' || rawStatus === 'error' ? rawStatus : null;
  const provider = searchParams.get('provider');
  const reason = searchParams.get('reason');

  const providerDisplayName = useMemo(
    () => (provider ? toDisplayName(provider) : undefined),
    [provider],
  );

  const dismissFeedback = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('integrationStatus');
    next.delete('provider');
    next.delete('reason');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <Container direction="col" gap={4} className="w-full">
      <ConnectionFeedbackBanner
        status={status}
        providerDisplayName={providerDisplayName}
        reason={reason}
        onDismiss={dismissFeedback}
      />
      <IntegrationsDashboard client={integrationsClient} />
    </Container>
  );
}
