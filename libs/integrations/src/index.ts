// Server-only: third-party account linking (OAuth today) on a user's behalf. This is the single
// public entry point for integration credentials - nothing else should read @inithium/db's
// integration repository directly, since only this library can decrypt or refresh what it stores.
export {
  listUserIntegrations,
  beginIntegrationAuthorization,
  completeIntegrationAuthorization,
  getIntegrationAccessToken,
  disconnectIntegration,
  buildIntegrationRedirectUri,
} from './service/integration.service';
export type {
  IntegrationCatalogEntry,
  IntegrationConnectionSummary,
  IntegrationAccessToken,
  IntegrationCallbackResult,
} from './service/integration.service';
export { listIntegrationProviders, getIntegrationProvider } from './providers/registry';
export { IntegrationAuthRevokedError } from './contracts/integration-provider.contract';
export type {
  IntegrationProvider,
  OAuth2IntegrationProvider,
  IntegrationProviderPresentation,
  OAuthTokenSet,
  ExternalAccountProfile,
} from './contracts/integration-provider.contract';
