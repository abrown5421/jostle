import { describe, expect, it, vi } from 'vitest';
import type { MessageEnvelope } from '../envelope/index.js';
import { composeMiddleware } from './pipeline.js';
import type { Middleware } from './types.js';

const baseEnvelope: MessageEnvelope = {
  id: '1',
  topic: 'test',
  timestamp: 0,
  payload: { count: 0 },
  meta: {},
};

describe('composeMiddleware', () => {
  it('runs middlewares in order and forwards transformed envelopes', async () => {
    const order: string[] = [];
    const increment: Middleware = (envelope, next) => {
      order.push('increment');
      const payload = envelope.payload as { count: number };
      return next({ ...envelope, payload: { count: payload.count + 1 } });
    };
    const label: Middleware = (envelope, next) => {
      order.push('label');
      return next({ ...envelope, meta: { ...envelope.meta, labeled: true } });
    };

    const pipeline = composeMiddleware([increment, label]);
    const terminal = vi.fn(async () => {});
    await pipeline(baseEnvelope, terminal);

    expect(order).toEqual(['increment', 'label']);
    expect(terminal).toHaveBeenCalledWith({
      ...baseEnvelope,
      payload: { count: 1 },
      meta: { labeled: true },
    });
  });

  it('short-circuits when a middleware does not call next', async () => {
    const reject: Middleware = () => Promise.resolve();
    const pipeline = composeMiddleware([reject]);
    const terminal = vi.fn(async () => {});

    await pipeline(baseEnvelope, terminal);

    expect(terminal).not.toHaveBeenCalled();
  });

  it('calls the terminal directly when there are no middlewares', async () => {
    const pipeline = composeMiddleware([]);
    const terminal = vi.fn(async () => {});

    await pipeline(baseEnvelope, terminal);

    expect(terminal).toHaveBeenCalledWith(baseEnvelope);
  });
});
