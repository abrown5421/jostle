import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type { SessionConfigurationDocument, SessionDocument, SessionPlayerDocument } from '../model/index.js';

export function getSessionsCollection(): Collection<SessionDocument> {
  return getClient().db().collection<SessionDocument>('game_sessions');
}

export function getSessionPlayersCollection(): Collection<SessionPlayerDocument> {
  return getClient().db().collection<SessionPlayerDocument>('game_session_players');
}

export function getSessionConfigurationsCollection(): Collection<SessionConfigurationDocument> {
  return getClient().db().collection<SessionConfigurationDocument>('game_session_configurations');
}

let indexesEnsured = false;
export async function ensureSessionIndexes(): Promise<void> {
  if (indexesEnsured) return;
  await getSessionsCollection().createIndex({ joinCode: 1 }, { unique: true });
  await getSessionPlayersCollection().createIndex({ sessionId: 1, displayName: 1 }, { unique: true });
  await getSessionPlayersCollection().createIndex({ sessionId: 1 });
  await getSessionConfigurationsCollection().createIndex({ sessionId: 1 }, { unique: true });
  indexesEnsured = true;
}
