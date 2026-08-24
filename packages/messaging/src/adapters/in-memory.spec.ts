import { describe, expect, it, vi } from 'vitest';
import { createInMemoryTransport } from './in-memory.js';

describe('createInMemoryTransport', () => {
  it('delivers published payloads to subscribers of the same topic', async () => {
    const transport = createInMemoryTransport();
    const handler = vi.fn();
    transport.subscribe('topic-a', handler);

    await transport.publish('topic-a', { value: 1 });

    expect(handler).toHaveBeenCalledWith({ topic: 'topic-a', payload: { value: 1 } });
  });

  it('does not deliver to subscribers of a different topic', async () => {
    const transport = createInMemoryTransport();
    const handler = vi.fn();
    transport.subscribe('topic-a', handler);

    await transport.publish('topic-b', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribe', async () => {
    const transport = createInMemoryTransport();
    const handler = vi.fn();
    const unsubscribe = transport.subscribe('topic-a', handler);
    unsubscribe();

    await transport.publish('topic-a', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers on the same topic', async () => {
    const transport = createInMemoryTransport();
    const first = vi.fn();
    const second = vi.fn();
    transport.subscribe('topic-a', first);
    transport.subscribe('topic-a', second);

    await transport.publish('topic-a', { value: 1 });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
