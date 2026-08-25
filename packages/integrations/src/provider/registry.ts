import type { IntegrationProviderConfig } from './types.js';

const providers = new Map<string, IntegrationProviderConfig>();

export function registerProvider(config: IntegrationProviderConfig): void {
  providers.set(config.id, config);
}

export function getProvider(id: string): IntegrationProviderConfig | undefined {
  return providers.get(id);
}

export function listProviders(): IntegrationProviderConfig[] {
  return Array.from(providers.values());
}
