import type { MessageEnvelope } from '../envelope/index.js';
import type { Middleware } from './types.js';

export type EnvelopeTransform = (envelope: MessageEnvelope) => MessageEnvelope;

export function createTransformMiddleware(transform: EnvelopeTransform): Middleware {
  return (envelope, next) => next(transform(envelope));
}
