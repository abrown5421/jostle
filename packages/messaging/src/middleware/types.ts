import type { MessageEnvelope } from '../envelope/index.js';

export type MiddlewareNext = (envelope: MessageEnvelope) => Promise<void>;

export type Middleware = (envelope: MessageEnvelope, next: MiddlewareNext) => Promise<void>;
