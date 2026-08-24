import { ObjectId } from 'mongodb';
import { toPublicSession } from '../model/index.js';
import type { PublicSession, SessionDocument } from '../model/index.js';
import { ensureSessionIndexes, getSessionsCollection } from './collection.js';
import { generateJoinCode } from './join-code.js';

const MAX_JOIN_CODE_ATTEMPTS = 5;

export class JoinCodeGenerationFailedError extends Error {
  constructor() {
    super('Could not generate a unique join code. Please try again.');
    this.name = 'JoinCodeGenerationFailedError';
  }
}

function isDuplicateJoinCodeError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export interface CreateSessionInput {
  readonly hostUserId: string;
}

export async function createSession(input: CreateSessionInput): Promise<PublicSession> {
  await ensureSessionIndexes();

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    const document: SessionDocument = {
      _id: new ObjectId(),
      joinCode: generateJoinCode(),
      hostUserId: new ObjectId(input.hostUserId),
      status: 'lobby',
      createdAt: new Date(),
    };

    try {
      await getSessionsCollection().insertOne(document);
      return toPublicSession(document);
    } catch (error) {
      if (!isDuplicateJoinCodeError(error)) throw error;
    }
  }

  throw new JoinCodeGenerationFailedError();
}
