import type { IntegrationsClient } from '@jostle/integrations-ui';

interface IntegrationsResponse {
  integrations: Awaited<ReturnType<IntegrationsClient['listIntegrations']>>;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

export const integrationsClient: IntegrationsClient = {
  async listIntegrations() {
    const { integrations } = (await getJson('/api/integrations')) as IntegrationsResponse;
    return integrations;
  },

  async disconnectIntegration(provider) {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to disconnect ${provider} (status ${response.status})`);
    }
  },
};
