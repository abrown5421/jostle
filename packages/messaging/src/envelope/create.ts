import type { MessageEnvelope } from './types.js';

export interface CreateEnvelopeInput<TPayload> {
  readonly topic: string;
  readonly payload: TPayload;
  readonly meta?: Readonly<Record<string, unknown>>;
  readonly id?: string;
  readonly timestamp?: number;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createEnvelope<TPayload>(input: CreateEnvelopeInput<TPayload>): MessageEnvelope<TPayload> {
  return {
    id: input.id ?? generateId(),
    topic: input.topic,
    timestamp: input.timestamp ?? Date.now(),
    payload: input.payload,
    meta: input.meta ?? {},
  };
}
