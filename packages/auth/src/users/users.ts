import { getClient } from '@jostle/db';
import { ObjectId } from 'mongodb';
import type { Collection } from 'mongodb';
import { hashPassword } from '../password/index.js';
import type { PublicUser, UserDocument } from './types.js';

function getUsersCollection(): Collection<UserDocument> {
  return getClient().db().collection<UserDocument>('users');
}

// A unique index makes "no two users share an email" a real DB-level
// guarantee instead of a check-then-insert race condition. Idempotent —
// safe to call on every createUser rather than needing a separate
// migration step.
let indexesEnsured = false;
async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  await getUsersCollection().createIndex({ email: 1 }, { unique: true });
  indexesEnsured = true;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Email is already in use');
    this.name = 'EmailAlreadyInUseError';
  }
}

export interface CreateUserInput {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  await ensureIndexes();

  const document: UserDocument = {
    _id: new ObjectId(),
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || undefined,
    email: input.email.trim().toLowerCase(),
    passwordHash: await hashPassword(input.password),
    createdAt: new Date(),
  };

  try {
    await getUsersCollection().insertOne(document);
    return toPublicUser(document);
  } catch (error) {
    if (isDuplicateEmailError(error)) throw new EmailAlreadyInUseError();
    throw error;
  }
}

function isDuplicateEmailError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  return getUsersCollection().findOne({ email: email.trim().toLowerCase() });
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  return getUsersCollection().findOne({ _id: new ObjectId(id) });
}
