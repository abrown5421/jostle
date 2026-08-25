import type { ObjectId } from 'mongodb';

/** The real MongoDB document — never sent to a client (has encrypted tokens). */
export interface UserIntegrationDocument {
  _id: ObjectId;
  userId: ObjectId;
  provider: string;
  providerAccountId: string;
  /** AES-256-GCM ciphertext, packed as `iv:authTag:ciphertext` (base64 segments). */
  accessToken: string;
  /** AES-256-GCM ciphertext, packed as `iv:authTag:ciphertext` (base64 segments). */
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe to send to the client — no tokens. */
export interface PublicConnectedIntegration {
  provider: string;
  connected: true;
  providerAccountId: string;
  scopes: string[];
  metadata: Record<string, unknown>;
  connectedAt: string;
}

export interface PublicUnconnectedIntegration {
  provider: string;
  connected: false;
}

export type PublicIntegrationStatus =
  | (PublicConnectedIntegration & PublicProviderInfo)
  | (PublicUnconnectedIntegration & PublicProviderInfo);

export interface PublicProviderInfo {
  displayName: string;
  logoUrl: string;
}

export interface IntegrationConnectionAttemptDocument {
  _id: ObjectId;
  state: string;
  userId: ObjectId;
  provider: string;
  codeVerifier: string;
  createdAt: Date;
  expiresAt: Date;
}
