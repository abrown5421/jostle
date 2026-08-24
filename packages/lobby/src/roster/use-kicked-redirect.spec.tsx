import { createInMemoryTransport, createPubSub, publishTopic, sessionRosterTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKickedRedirect } from './use-kicked-redirect.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('useKickedRedirect', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;

  function Probe({ playerId, onKicked }: { playerId: string; onKicked: () => void }) {
    useKickedRedirect({ pubsub, sessionId: 'session-1', playerId, onKicked });
    return null;
  }

  beforeEach(() => {
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls onKicked when this player is kicked', async () => {
    const onKicked = vi.fn();
    act(() => {
      root.render(<Probe playerId="1" onKicked={onKicked} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_KICKED', player: { sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' } },
      });
    });

    expect(onKicked).toHaveBeenCalledTimes(1);
  });

  it('does not call onKicked when a different player is kicked', async () => {
    const onKicked = vi.fn();
    act(() => {
      root.render(<Probe playerId="1" onKicked={onKicked} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_KICKED', player: { sessionId: 'session-1', playerId: '2', userId: null, displayName: 'Bob' } },
      });
    });

    expect(onKicked).not.toHaveBeenCalled();
  });

  it('does not call onKicked for a PLAYER_JOINED event', async () => {
    const onKicked = vi.fn();
    act(() => {
      root.render(<Probe playerId="1" onKicked={onKicked} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_JOINED', player: { sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' } },
      });
    });

    expect(onKicked).not.toHaveBeenCalled();
  });
});
