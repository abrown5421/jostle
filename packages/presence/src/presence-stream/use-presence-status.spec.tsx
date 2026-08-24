import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryTransport, createPubSub, presenceTopic, publishTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { usePresenceStatus } from './use-presence-status.js';

function StatusProbe({ pubsub, entityId }: { pubsub: PubSub; entityId: string }) {
  const status = usePresenceStatus({ pubsub, entityId });
  return <span data-testid="status">{status}</span>;
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('usePresenceStatus', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;

  beforeEach(() => {
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function text() {
    return container.querySelector('[data-testid="status"]')?.textContent;
  }

  it('starts offline before any presence payload arrives', () => {
    act(() => {
      root.render(<StatusProbe pubsub={pubsub} entityId="user-1" />);
    });
    expect(text()).toBe('offline');
  });

  it('updates when a presence payload is published for the same entity', async () => {
    act(() => {
      root.render(<StatusProbe pubsub={pubsub} entityId="user-1" />);
    });

    await act(async () => {
      await publishTopic(pubsub, presenceTopic, {
        params: { entityId: 'user-1' },
        payload: { entityId: 'user-1', status: 'busy', timestamp: Date.now() },
      });
    });

    expect(text()).toBe('busy');
  });

  it('ignores payloads published for a different entity', async () => {
    act(() => {
      root.render(<StatusProbe pubsub={pubsub} entityId="user-1" />);
    });

    await act(async () => {
      await publishTopic(pubsub, presenceTopic, {
        params: { entityId: 'user-2' },
        payload: { entityId: 'user-2', status: 'busy', timestamp: Date.now() },
      });
    });

    expect(text()).toBe('offline');
  });
});
