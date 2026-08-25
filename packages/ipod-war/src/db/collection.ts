import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type { IpodWarStateDocument, IpodWarSubmissionDocument } from '../model/index.js';

export function getIpodWarStatesCollection(): Collection<IpodWarStateDocument> {
  return getClient().db().collection<IpodWarStateDocument>('ipod_war_states');
}

export function getIpodWarSubmissionsCollection(): Collection<IpodWarSubmissionDocument> {
  return getClient().db().collection<IpodWarSubmissionDocument>('ipod_war_submissions');
}

let indexesEnsured = false;
export async function ensureIpodWarIndexes(): Promise<void> {
  if (indexesEnsured) return;
  await getIpodWarStatesCollection().createIndex({ sessionId: 1 }, { unique: true });
  await getIpodWarSubmissionsCollection().createIndex(
    { sessionId: 1, roundIndex: 1, playerId: 1 },
    { unique: true },
  );
  await getIpodWarSubmissionsCollection().createIndex({ sessionId: 1, roundIndex: 1 });
  indexesEnsured = true;
}
