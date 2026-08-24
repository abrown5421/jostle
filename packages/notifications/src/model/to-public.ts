import type { NotificationDocument, PublicNotification } from './types.js';

export function toPublicNotification<TPayload>(
  document: NotificationDocument<TPayload>
): PublicNotification<TPayload> {
  return {
    id: document._id.toString(),
    recipientId: document.recipientId.toString(),
    type: document.type,
    readStatus: document.readStatus,
    payload: document.payload,
    createdAt: document.createdAt.toISOString(),
  };
}
