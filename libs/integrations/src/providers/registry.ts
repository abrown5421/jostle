import type { IntegrationProvider } from '../contracts/integration-provider.contract';
import { spotifyProvider } from './spotify/spotify.provider';

// Every third-party integration a user can link from their profile. Adding one (Facebook, ...)
// is one provider file implementing IntegrationProvider plus one entry here - the routes, storage,
// encryption, token refresh and profile-tab UI are all provider-agnostic and never change.
// Order here is the order the profile tab lists them in.
const integrationProviders: readonly IntegrationProvider[] = [
  spotifyProvider,
  // inithium:anchor:integration-providers
];

export const listIntegrationProviders = (): readonly IntegrationProvider[] => integrationProviders;

export const getIntegrationProvider = (id: string): IntegrationProvider | undefined =>
  integrationProviders.find((provider) => provider.id === id);
