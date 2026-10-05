import type { ApiResponse } from '@inithium/api-utils';
import { baseApi } from '../baseApi';

// Local mirror of @inithium/integrations' IntegrationCatalogEntry - that library is server-only
// (node:crypto, provider secrets), so its shapes are duplicated here rather than imported, the
// same "duplicate the shape, not the import" convention settings.endpoints.ts follows.
export type IntegrationStatus = 'connected' | 'needs-reauth';
export type IntegrationCallbackResult = 'connected' | 'cancelled' | 'error';

export interface IntegrationConnection {
  status: IntegrationStatus;
  externalAccountId: string;
  externalAccountName?: string;
  externalAccountImageUrl?: string;
  scopes: string[];
  connectedAt: string;
  updatedAt: string;
  notices: string[];
}

export interface IntegrationCatalogEntry {
  provider: string;
  kind: 'oauth2';
  displayName: string;
  description: string;
  icon: string;
  brandColor: string;
  capabilities: string[];
  manageAccessUrl?: string;
  // False when this deployment hasn't configured the provider's credentials.
  isAvailable: boolean;
  connection: IntegrationConnection | null;
}

export interface IntegrationAccessToken {
  accessToken: string;
  tokenType: string;
  expiresAt?: number;
  scopes: string[];
}

export interface StartIntegrationAuthorizationInput {
  provider: string;
  returnTo?: string;
}

export const integrationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listIntegrations: builder.query<IntegrationCatalogEntry[], void>({
      query: () => '/api/integrations',
      transformResponse: (response: ApiResponse<IntegrationCatalogEntry[]>) => response.data,
      providesTags: ['Integration'],
    }),
    // Returns the provider's consent URL - the caller navigates the browser there itself
    // (window.location.assign), and the provider redirects back via the API's callback route.
    startIntegrationAuthorization: builder.mutation<{ authorizeUrl: string }, StartIntegrationAuthorizationInput>({
      query: ({ provider, returnTo }) => ({
        url: `/api/integrations/${encodeURIComponent(provider)}/authorize`,
        method: 'POST',
        body: { returnTo },
      }),
      transformResponse: (response: ApiResponse<{ authorizeUrl: string }>) => response.data,
    }),
    disconnectIntegration: builder.mutation<void, string>({
      query: (provider) => ({ url: `/api/integrations/${encodeURIComponent(provider)}`, method: 'DELETE' }),
      invalidatesTags: ['Integration'],
    }),
    // For browser SDKs that need the raw token (Spotify's Web Playback SDK getOAuthToken callback).
    // keepUnusedDataFor: 0 so a token never lingers in the cache - use the lazy hook and call
    // its trigger each time, which always refetches (the server refreshes it when needed).
    getIntegrationAccessToken: builder.query<IntegrationAccessToken, string>({
      query: (provider) => `/api/integrations/${encodeURIComponent(provider)}/token`,
      transformResponse: (response: ApiResponse<IntegrationAccessToken>) => response.data,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useListIntegrationsQuery,
  useStartIntegrationAuthorizationMutation,
  useDisconnectIntegrationMutation,
  useLazyGetIntegrationAccessTokenQuery,
} = integrationsApi;
