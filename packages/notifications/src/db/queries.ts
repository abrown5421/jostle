import { ObjectId } from 'mongodb';
import type { Filter } from 'mongodb';
import { toPublicNotification } from '../model/index.js';
import type { NotificationDocument, PublicNotification } from '../model/index.js';
import { getNotificationsCollection } from './collection.js';

const DEFAULT_PAGE_SIZE = 20;

export interface ListNotificationsInput {
  readonly recipientId: string;
  readonly limit?: number;
  readonly before?: Date;
}

export interface ListNotificationsResult {
  readonly items: PublicNotification[];
  readonly nextCursor: string | null;
}

export async function listNotifications(input: ListNotificationsInput): Promise<ListNotificationsResult> {
  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const filter: Filter<NotificationDocument> = {
    recipientId: new ObjectId(input.recipientId),
    ...(input.before ? { createdAt: { $lt: input.before } } : {}),
  };

  const documents = await getNotificationsCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = documents.length > limit;
  const page = hasMore ? documents.slice(0, limit) : documents;
  const last = page[page.length - 1];

  return {
    items: page.map(toPublicNotification),
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
  };
}

export async function countUnreadNotifications(recipientId: string): Promise<number> {
  return getNotificationsCollection().countDocuments({
    recipientId: new ObjectId(recipientId),
    readStatus: false,
  });
}
