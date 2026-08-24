import type { NotificationEventPayload } from '@jostle/messaging';
import type { NotificationFormatter } from '../pipeline/index.js';

export interface FriendRequestNotificationPayload {
  readonly initiatorId: string;
  readonly requestEventType: NotificationEventPayload['type'];
  readonly metadata: Readonly<Record<string, unknown>>;
}

export const friendRequestFormatter: NotificationFormatter<
  NotificationEventPayload,
  FriendRequestNotificationPayload
> = (envelope) => ({
  recipientId: envelope.payload.targetId,
  type: 'friend_request',
  payload: {
    initiatorId: envelope.payload.initiatorId,
    requestEventType: envelope.payload.type,
    metadata: envelope.payload.metadata,
  },
});
