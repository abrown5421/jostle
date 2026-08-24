import { ObjectId } from 'mongodb';
import { toPublicNotification } from '../model/index.js';
import type { NotificationDocument, PublicNotification } from '../model/index.js';
import { ensureNotificationIndexes, getNotificationsCollection } from './collection.js';

export interface CreateNotificationInput<TPayload = unknown> {
  readonly recipientId: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly createdAt?: Date;
}

export async function createNotification<TPayload = unknown>(
  input: CreateNotificationInput<TPayload>
): Promise<PublicNotification<TPayload>> {
  await ensureNotificationIndexes();

  const document: NotificationDocument<TPayload> = {
    _id: new ObjectId(),
    recipientId: new ObjectId(input.recipientId),
    type: input.type,
    readStatus: false,
    payload: input.payload,
    createdAt: input.createdAt ?? new Date(),
  };

  await getNotificationsCollection().insertOne(document as NotificationDocument);
  return toPublicNotification(document);
}
