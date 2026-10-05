// 'connected': credentials are believed good (refreshed on demand by @inithium/integrations).
// 'needs-reauth': the provider rejected our refresh (user revoked access on the provider's side,
// password change, app removed, ...) - the row is kept so the UI can say "Reconnect" rather than
// silently looking like it was never connected.
export const INTEGRATION_STATUSES = ['connected', 'needs-reauth'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

// One row per (userId, provider) - a user links at most one external account per provider.
// `provider` is a plain string (not a closed union) on purpose: the set of providers lives in
// @inithium/integrations' own registry, so adding Facebook/etc. never touches this layer.
export interface IntegrationEntity {
  id: string;
  userId: string;
  provider: string;
  status: IntegrationStatus;
  externalAccountId: string;
  externalAccountName?: string;
  externalAccountImageUrl?: string;
  scopes: string[];
  // Provider-defined credential payload (OAuth tokens today, maybe an API key tomorrow),
  // encrypted by @inithium/integrations before it ever reaches this layer. Opaque here - this
  // library never decrypts or interprets it, and it must never be returned to a client as-is.
  encryptedCredentials: string;
  // Denormalized out of the encrypted blob so "is this about to expire" never needs a decrypt.
  credentialsExpireAt?: Date;
  // Non-secret, provider-specific facts about the linked account (e.g. Spotify's `product`
  // tier, which decides whether in-browser playback is possible).
  metadata: Record<string, unknown>;
  connectedAt: Date;
  updatedAt: Date;
}

export type UpsertIntegrationInput = {
  userId: string;
  provider: string;
  externalAccountId: string;
  externalAccountName?: string;
  externalAccountImageUrl?: string;
  scopes: string[];
  encryptedCredentials: string;
  credentialsExpireAt?: Date;
  metadata?: Record<string, unknown>;
};

export type UpdateIntegrationCredentialsInput = {
  encryptedCredentials: string;
  credentialsExpireAt?: Date;
  scopes?: string[];
  // A fresh read of the account's non-secret facts (e.g. after Spotify Free -> Premium), when the
  // refresh fetched one.
  metadata?: Record<string, unknown>;
};

export interface IntegrationRepository {
  findForUser: (userId: string, provider: string) => Promise<IntegrationEntity | null>;
  listForUser: (userId: string) => Promise<IntegrationEntity[]>;
  // Connect and reconnect are the same write - a reconnect replaces the credentials/account in
  // place, resets status to 'connected', and stamps a fresh connectedAt.
  upsert: (input: UpsertIntegrationInput) => Promise<IntegrationEntity>;
  updateCredentials: (
    userId: string,
    provider: string,
    input: UpdateIntegrationCredentialsInput,
  ) => Promise<IntegrationEntity | null>;
  updateStatus: (userId: string, provider: string, status: IntegrationStatus) => Promise<IntegrationEntity | null>;
  delete: (userId: string, provider: string) => Promise<boolean>;
}
