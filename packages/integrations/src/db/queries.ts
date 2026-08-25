import { ObjectId } from 'mongodb';
import { encryptToken } from '../crypto/index.js';
import type { UserIntegrationDocument } from '../model/index.js';
import type { OAuthTokenResult, ProviderProfile } from '../provider/index.js';
import { generateCodeVerifier, generateState } from '../oauth/index.js';
import {
  getConnectionAttemptsCollection,
  getUserIntegrationsCollection,
} from './collection.js';

const CONNECTION_ATTEMPT_TTL_MS = 10 * 60 * 1000;

let indexesEnsured = false;
async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  await getUserIntegrationsCollection().createIndex(
    { userId: 1, provider: 1 },
    { unique: true },
  );
  await getConnectionAttemptsCollection().createIndex(
    { state: 1 },
    { unique: true },
  );
  await getConnectionAttemptsCollection().createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
  indexesEnsured = true;
}

export interface ConnectionAttempt {
  state: string;
  codeVerifier: string;
}

export async function createConnectionAttempt(
  userId: string,
  provider: string,
): Promise<ConnectionAttempt> {
  await ensureIndexes();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const now = new Date();

  await getConnectionAttemptsCollection().insertOne({
    _id: new ObjectId(),
    state,
    userId: new ObjectId(userId),
    provider,
    codeVerifier,
    createdAt: now,
    expiresAt: new Date(now.getTime() + CONNECTION_ATTEMPT_TTL_MS),
  });

  return { state, codeVerifier };
}

export interface ConsumedConnectionAttempt {
  userId: string;
  codeVerifier: string;
}

export async function consumeConnectionAttempt(
  state: string,
  provider: string,
): Promise<ConsumedConnectionAttempt | null> {
  const attempt = await getConnectionAttemptsCollection().findOneAndDelete({
    state,
    provider,
    expiresAt: { $gt: new Date() },
  });
  if (!attempt) return null;

  return { userId: attempt.userId.toString(), codeVerifier: attempt.codeVerifier };
}

export async function upsertUserIntegration(
  userId: string,
  provider: string,
  tokens: OAuthTokenResult,
  profile: ProviderProfile,
): Promise<UserIntegrationDocument> {
  await ensureIndexes();
  const now = new Date();

  const result = await getUserIntegrationsCollection().findOneAndUpdate(
    { userId: new ObjectId(userId), provider },
    {
      $set: {
        providerAccountId: profile.providerAccountId,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: encryptToken(tokens.refreshToken ?? ''),
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        metadata: profile.metadata,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        provider,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!result) {
    throw new Error(`Failed to upsert integration for provider ${provider}`);
  }
  return result;
}

export async function listUserIntegrations(
  userId: string,
): Promise<UserIntegrationDocument[]> {
  return getUserIntegrationsCollection()
    .find({ userId: new ObjectId(userId) })
    .toArray();
}

export async function findUserIntegration(
  userId: string,
  provider: string,
): Promise<UserIntegrationDocument | null> {
  return getUserIntegrationsCollection().findOne({
    userId: new ObjectId(userId),
    provider,
  });
}

export async function deleteUserIntegration(
  userId: string,
  provider: string,
): Promise<void> {
  await getUserIntegrationsCollection().deleteOne({
    userId: new ObjectId(userId),
    provider,
  });
}

export async function updateUserIntegrationTokens(
  userId: string,
  provider: string,
  tokens: OAuthTokenResult,
): Promise<UserIntegrationDocument | null> {
  const setFields: Partial<
    Pick<UserIntegrationDocument, 'accessToken' | 'refreshToken' | 'expiresAt' | 'scopes' | 'updatedAt'>
  > = {
    accessToken: encryptToken(tokens.accessToken),
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes,
    updatedAt: new Date(),
  };
  if (tokens.refreshToken) {
    setFields.refreshToken = encryptToken(tokens.refreshToken);
  }

  return getUserIntegrationsCollection().findOneAndUpdate(
    { userId: new ObjectId(userId), provider },
    { $set: setFields },
    { returnDocument: 'after' },
  );
}
