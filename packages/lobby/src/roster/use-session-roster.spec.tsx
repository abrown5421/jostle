import { createInMemoryTransport, createPubSub, publishTopic, sessionRosterTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyClient } from './lobby-client.js';
import { useSessionRoster } from './use-session-roster.js';
import type { SessionRosterController } from './use-session-roster.js';

class FakeAudio {
  currentTime = 0;
  play(): Promise<void> {
    return Promise.resolve();
  }
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function createFakeClient(overrides: Partial<LobbyClient> = {}): LobbyClient {
  return {
    createSession: vi.fn(),
    getSessionById: vi.fn(),
    joinSession: vi.fn(),
    listPlayers: vi.fn().mockResolvedValue([]),
    removePlayer: vi.fn().mockResolvedValue(undefined),
    setSessionConfiguration: vi.fn(),
    getSessionConfiguration: vi.fn(),
    ...overrides,
  };
}

describe('useSessionRoster', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;
  let controller: SessionRosterController | undefined;

  function Probe({ client }: { client: LobbyClient }) {
    controller = useSessionRoster({ pubsub, sessionId: 'session-1', client });
    return <span data-testid="players">{controller.players.map((p) => p.playerId).join(',')}</span>;
  }

  beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    controller = undefined;
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function text() {
    return container.querySelector('[data-testid="players"]')?.textContent;
  }

  it('seeds players from the initial fetch', async () => {
    const client = createFakeClient({
      listPlayers: vi.fn().mockResolvedValue([{ sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' }]),
    });

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    expect(text()).toBe('1');
  });

  it('adds a player on a live PLAYER_JOINED event', async () => {
    const client = createFakeClient();
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_JOINED', player: { sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' } },
      });
    });

    expect(text()).toBe('1');
  });

  it('removes a player on a live PLAYER_KICKED event', async () => {
    const client = createFakeClient({
      listPlayers: vi.fn().mockResolvedValue([{ sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' }]),
    });
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_KICKED', player: { sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' } },
      });
    });

    expect(text()).toBe('');
  });

  it('removes a player on a live PLAYER_LEFT event', async () => {
    const client = createFakeClient({
      listPlayers: vi.fn().mockResolvedValue([{ sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' }]),
    });
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionRosterTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'PLAYER_LEFT', player: { sessionId: 'session-1', playerId: '1', userId: null, displayName: 'Ada' } },
      });
    });

    expect(text()).toBe('');
  });

  it('calls client.removePlayer when kickPlayer is invoked', async () => {
    const client = createFakeClient();
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await controller!.kickPlayer('1');
    });

    expect(client.removePlayer).toHaveBeenCalledWith({ sessionId: 'session-1', playerId: '1' });
  });
});
