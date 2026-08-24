import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type { NotificationDocument } from '../model/index.js';

export function getNotificationsCollection(): Collection<NotificationDocument> {
  return getClient().db().collection<NotificationDocument>('notifications');
}

let indexesEnsured = false;
export async function ensureNotificationIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const collection = getNotificationsCollection();
  await collection.createIndex({ recipientId: 1, createdAt: -1 });
  await collection.createIndex({ recipientId: 1, readStatus: 1 });
  indexesEnsured = true;
}
