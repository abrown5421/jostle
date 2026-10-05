// Server-only: third-party account linking (OAuth today) on a user's behalf. This is the single
// public entry point for integration credentials - nothing else should read @inithium/db's
// integration repository directly, since only this library can decrypt or refresh what it stores.
export {
  listUserIntegrations,
  beginIntegrationAuthorization,
  completeIntegrationAuthorization,
  getIntegrationAccessToken,
  withIntegrationAccessToken,
  evaluateIntegrationRequirements,
  listIntegrationResources,
  disconnectIntegration,
  buildIntegrationRedirectUri,
} from './service/integration.service';
export type {
  IntegrationRequirement,
  IntegrationCatalogEntry,
  IntegrationConnectionSummary,
  IntegrationAccessToken,
  IntegrationCallbackResult,
} from './service/integration.service';
export { listIntegrationProviders, getIntegrationProvider } from './providers/registry';
export { IntegrationAuthRevokedError, IntegrationRequestError } from './contracts/integration-provider.contract';
export type {
  IntegrationResource,
  IntegrationResourceSource,
  IntegrationProvider,
  OAuth2IntegrationProvider,
  IntegrationProviderPresentation,
  OAuthTokenSet,
  ExternalAccountProfile,
} from './contracts/integration-provider.contract';

// Spotify's Web API on a user's behalf - for features built on Spotify specifically (iPod War).
export { loadSpotifyPlaylistForUser } from './providers/spotify/spotify.service';
export type { SpotifyPlaylistWithTracks } from './providers/spotify/spotify.service';
export type { SpotifyTrack, SpotifyPlaylistSummary } from './providers/spotify/spotify.api';
