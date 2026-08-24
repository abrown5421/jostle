import { ObjectId } from 'mongodb';
import { toPublicSession, toPublicSessionPlayer } from '../model/index.js';
import type { PublicSession, PublicSessionPlayer } from '../model/index.js';
import { getSessionPlayersCollection, getSessionsCollection } from './collection.js';

export async function getSessionById(sessionId: string): Promise<PublicSession | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  const document = await getSessionsCollection().findOne({ _id: new ObjectId(sessionId) });
  return document ? toPublicSession(document) : null;
}

export async function getSessionByJoinCode(joinCode: string): Promise<PublicSession | null> {
  const document = await getSessionsCollection().findOne({ joinCode: joinCode.trim().toUpperCase() });
  return document ? toPublicSession(document) : null;
}

export async function listSessionPlayers(sessionId: string): Promise<PublicSessionPlayer[]> {
  if (!ObjectId.isValid(sessionId)) return [];
  const documents = await getSessionPlayersCollection()
    .find({ sessionId: new ObjectId(sessionId) })
    .sort({ joinedAt: 1 })
    .toArray();
  return documents.map(toPublicSessionPlayer);
}
