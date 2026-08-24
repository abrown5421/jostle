import { ObjectId } from 'mongodb';
import { getNotificationsCollection } from './collection.js';

export interface MarkNotificationsAsReadInput {
  readonly recipientId: string;
  readonly ids: ReadonlyArray<string>;
}

export async function markNotificationsAsRead(input: MarkNotificationsAsReadInput): Promise<number> {
  const result = await getNotificationsCollection().updateMany(
    {
      recipientId: new ObjectId(input.recipientId),
      _id: { $in: input.ids.map((id) => new ObjectId(id)) },
    },
    { $set: { readStatus: true } }
  );
  return result.modifiedCount;
}

export async function markAllNotificationsAsRead(recipientId: string): Promise<number> {
  const result = await getNotificationsCollection().updateMany(
    { recipientId: new ObjectId(recipientId), readStatus: false },
    { $set: { readStatus: true } }
  );
  return result.modifiedCount;
}
