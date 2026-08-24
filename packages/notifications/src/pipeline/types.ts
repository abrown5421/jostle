import type { MessageEnvelope } from '@jostle/messaging';

export interface NormalizedNotificationInput<TPayload = unknown> {
  readonly recipientId: string;
  readonly type: string;
  readonly payload: TPayload;
}

export type NotificationFormatter<TSourcePayload = unknown, TNotificationPayload = unknown> = (
  envelope: MessageEnvelope<TSourcePayload>
) => NormalizedNotificationInput<TNotificationPayload> | undefined;
