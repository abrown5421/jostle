import { ObjectId } from 'mongodb';
import { toPublicSessionPlayer } from '../model/index.js';
import type { PublicSessionPlayer } from '../model/index.js';
import { ensureSessionIndexes, getSessionPlayersCollection, getSessionsCollection } from './collection.js';
import type { SessionPlayerDocument } from '../model/index.js';

export class DisplayNameAlreadyInUseError extends Error {
  constructor() {
    super('That display name is already taken in this session.');
    this.name = 'DisplayNameAlreadyInUseError';
  }
}

export class PlayerNotFoundError extends Error {
  constructor() {
    super('Player not found.');
    this.name = 'PlayerNotFoundError';
  }
}

export class NotAuthorizedToRemovePlayerError extends Error {
  constructor() {
    super('Not authorized to remove this player.');
    this.name = 'NotAuthorizedToRemovePlayerError';
  }
}

function isDuplicateDisplayNameError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export interface AddSessionPlayerInput {
  readonly sessionId: string;
  readonly userId: string | null;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export async function addSessionPlayer(input: AddSessionPlayerInput): Promise<PublicSessionPlayer> {
  await ensureSessionIndexes();

  const document: SessionPlayerDocument = {
    _id: new ObjectId(),
    sessionId: new ObjectId(input.sessionId),
    userId: input.userId ? new ObjectId(input.userId) : null,
    displayName: input.displayName.trim(),
    avatarUrl: input.avatarUrl,
    joinedAt: new Date(),
  };

  try {
    await getSessionPlayersCollection().insertOne(document);
    return toPublicSessionPlayer(document);
  } catch (error) {
    if (isDuplicateDisplayNameError(error)) throw new DisplayNameAlreadyInUseError();
    throw error;
  }
}

export interface RemoveSessionPlayerInput {
  readonly sessionId: string;
  readonly playerId: string;
  readonly actingUserId: string | null;
}

export interface RemoveSessionPlayerResult {
  readonly player: PublicSessionPlayer;
  readonly removedByHost: boolean;
}

export async function removeSessionPlayer(input: RemoveSessionPlayerInput): Promise<RemoveSessionPlayerResult> {
  if (!ObjectId.isValid(input.playerId) || !ObjectId.isValid(input.sessionId)) throw new PlayerNotFoundError();

  const playerDocument = await getSessionPlayersCollection().findOne({
    _id: new ObjectId(input.playerId),
    sessionId: new ObjectId(input.sessionId),
  });
  if (!playerDocument) throw new PlayerNotFoundError();

  const sessionDocument = await getSessionsCollection().findOne({ _id: new ObjectId(input.sessionId) });
  if (!sessionDocument) throw new PlayerNotFoundError();

  const isHost = input.actingUserId !== null && input.actingUserId === sessionDocument.hostUserId.toString();
  const isSelf =
    playerDocument.userId === null
      ? input.actingUserId === null
      : input.actingUserId === playerDocument.userId.toString();

  if (!isHost && !isSelf) throw new NotAuthorizedToRemovePlayerError();

  await getSessionPlayersCollection().deleteOne({ _id: playerDocument._id });

  return { player: toPublicSessionPlayer(playerDocument), removedByHost: isHost };
}
