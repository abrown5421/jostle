import { getClient } from '@jostle/db';
import { randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Collection } from 'mongodb';
import { findUserById, toPublicUser } from '../users/index.js';
import type { PublicUser } from '../users/index.js';
import type { SessionDocument } from './types.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionsCollection(): Collection<SessionDocument> {
  return getClient().db().collection<SessionDocument>('sessions');
}

let indexesEnsured = false;
async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  await getSessionsCollection().createIndex({ token: 1 }, { unique: true });
  // TTL index — MongoDB automatically deletes a session document once
  // expiresAt is in the past, so expired sessions never need manual cleanup.
  await getSessionsCollection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexesEnsured = true;
}

export async function createSession(userId: string): Promise<string> {
  await ensureIndexes();
  const token = randomBytes(32).toString('hex');
  const now = new Date();

  const document: SessionDocument = {
    _id: new ObjectId(),
    token,
    userId: new ObjectId(userId),
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
  };
  await getSessionsCollection().insertOne(document);

  return token;
}

export async function getUserForSessionToken(token: string): Promise<PublicUser | null> {
  const session = await getSessionsCollection().findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await findUserById(session.userId.toString());
  return user ? toPublicUser(user) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await getSessionsCollection().deleteOne({ token });
}
