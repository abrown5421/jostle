import { describe, expect, it } from 'vitest';
import { createFormatterRegistry } from './registry.js';
import type { NotificationFormatter } from './types.js';

describe('createFormatterRegistry', () => {
  const formatter: NotificationFormatter = (envelope) => ({
    recipientId: 'user-1',
    type: 'example',
    payload: envelope.payload,
  });

  it('resolves a formatter registered for a topic pattern', () => {
    const registry = createFormatterRegistry();
    registry.register('user:{userId}:notifications', formatter);

    expect(registry.resolve('user:{userId}:notifications')).toBe(formatter);
  });

  it('returns undefined for an unregistered pattern', () => {
    const registry = createFormatterRegistry();
    expect(registry.resolve('unregistered')).toBeUndefined();
  });

  it('unregisters via the returned function', () => {
    const registry = createFormatterRegistry();
    const unregister = registry.register('topic', formatter);
    unregister();

    expect(registry.resolve('topic')).toBeUndefined();
  });

  it('lets a later registration replace an earlier one for the same pattern', () => {
    const registry = createFormatterRegistry();
    const nextFormatter: NotificationFormatter = (envelope) => ({
      recipientId: 'user-2',
      type: 'other',
      payload: envelope.payload,
    });
    registry.register('topic', formatter);
    registry.register('topic', nextFormatter);

    expect(registry.resolve('topic')).toBe(nextFormatter);
  });

  it('unregistering a stale registration does not remove a newer, different formatter for the same pattern', () => {
    const registry = createFormatterRegistry();
    const nextFormatter: NotificationFormatter = (envelope) => ({
      recipientId: 'user-2',
      type: 'other',
      payload: envelope.payload,
    });
    const unregisterFirst = registry.register('topic', formatter);
    registry.register('topic', nextFormatter);
    unregisterFirst();

    expect(registry.resolve('topic')).toBe(nextFormatter);
  });
});
