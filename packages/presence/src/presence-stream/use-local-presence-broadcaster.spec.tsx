import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryTransport, createPubSub, presenceTopic, subscribeTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useLocalPresenceBroadcaster } from './use-local-presence-broadcaster.js';

function BroadcasterProbe({ pubsub, entityId }: { pubsub: PubSub; entityId: string }) {
  const status = useLocalPresenceBroadcaster({
    pubsub,
    entityId,
    isAuthenticated: true,
    idleThresholdMs: 1000,
  });
  return <span data-testid="status">{status}</span>;
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('useLocalPresenceBroadcaster', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;

  beforeEach(() => {
    vi.useFakeTimers();
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function text() {
    return container.querySelector('[data-testid="status"]')?.textContent;
  }

  it('reports and broadcasts online for an active authenticated user', () => {
    const received: string[] = [];
    subscribeTopic(pubsub, presenceTopic, { entityId: 'user-1' }, (envelope) => {
      received.push(envelope.payload.status);
    });

    act(() => {
      root.render(<BroadcasterProbe pubsub={pubsub} entityId="user-1" />);
    });

    expect(text()).toBe('online');
    expect(received).toEqual(['online']);
  });

  it('transitions to away and rebroadcasts exactly once after crossing the idle threshold', () => {
    const received: string[] = [];
    subscribeTopic(pubsub, presenceTopic, { entityId: 'user-1' }, (envelope) => {
      received.push(envelope.payload.status);
    });

    act(() => {
      root.render(<BroadcasterProbe pubsub={pubsub} entityId="user-1" />);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(text()).toBe('away');
    expect(received).toEqual(['online', 'away']);
  });
});
