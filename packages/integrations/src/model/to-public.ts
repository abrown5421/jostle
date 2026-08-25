import type {
  PublicConnectedIntegration,
  PublicProviderInfo,
  PublicUnconnectedIntegration,
  UserIntegrationDocument,
} from './types.js';

export function toPublicConnectedIntegration(
  document: UserIntegrationDocument,
  providerInfo: PublicProviderInfo,
): PublicConnectedIntegration & PublicProviderInfo {
  return {
    ...providerInfo,
    provider: document.provider,
    connected: true,
    providerAccountId: document.providerAccountId,
    scopes: document.scopes,
    metadata: document.metadata,
    connectedAt: document.createdAt.toISOString(),
  };
}

export function toPublicUnconnectedIntegration(
  provider: string,
  providerInfo: PublicProviderInfo,
): PublicUnconnectedIntegration & PublicProviderInfo {
  return {
    ...providerInfo,
    provider,
    connected: false,
  };
}
