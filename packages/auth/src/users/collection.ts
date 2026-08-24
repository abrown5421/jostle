import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type { UserDocument } from './types.js';

export function getUsersCollection(): Collection<UserDocument> {
  return getClient().db().collection<UserDocument>('users');
}
