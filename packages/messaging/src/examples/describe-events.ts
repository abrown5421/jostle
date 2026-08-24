import type { MessageEnvelope } from '../envelope/index.js';
import type { NotificationEventPayload, PresenceEventPayload, SessionTransactionPayload } from '../topics/index.js';

export function describePresenceEvent(envelope: MessageEnvelope<PresenceEventPayload>): string {
  return `presence:${envelope.payload.entityId} is now ${envelope.payload.status}`;
}

export function describeNotificationEvent(envelope: MessageEnvelope<NotificationEventPayload>): string {
  return `notification ${envelope.payload.type} from ${envelope.payload.initiatorId} to ${envelope.payload.targetId}`;
}

export function describeSessionEvent(envelope: MessageEnvelope<SessionTransactionPayload>): string {
  return `session tick ${envelope.payload.tick}: ${envelope.payload.kind} (${envelope.payload.scope})`;
}
