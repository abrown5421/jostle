import { createInMemoryTransport, createPubSub, publishTopic, sessionConfigTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionConfiguration } from './use-session-configuration.js';
import type { SessionConfigurationClient } from './types.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('useSessionConfiguration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;

  function Probe({ client }: { client: SessionConfigurationClient }) {
    const { configuration, isLoading } = useSessionConfiguration({ pubsub, sessionId: 'session-1', client });
    return (
      <span data-testid="result">
        {isLoading ? 'loading' : configuration ? `${configuration.gameId}:${JSON.stringify(configuration.selectedSettings)}` : 'none'}
      </span>
    );
  }

  beforeEach(() => {
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function text() {
    return container.querySelector('[data-testid="result"]')?.textContent;
  }

  it('seeds from the initial fetch', async () => {
    const client: SessionConfigurationClient = {
      getSessionConfiguration: vi.fn().mockResolvedValue({ gameId: 'fishbowl', selectedSettings: { roundCount: 3 } }),
    };

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    expect(text()).toBe('fishbowl:{"roundCount":3}');
  });

  it('reports null when no configuration exists yet', async () => {
    const client: SessionConfigurationClient = { getSessionConfiguration: vi.fn().mockResolvedValue(null) };

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    expect(text()).toBe('none');
  });

  it('updates live on a GAME_SELECTED event', async () => {
    const client: SessionConfigurationClient = { getSessionConfiguration: vi.fn().mockResolvedValue(null) };
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionConfigTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'GAME_SELECTED', sessionId: 'session-1', gameId: 'point-of-hue', selectedSettings: { memoryPhaseTimerSeconds: 10 } },
      });
    });

    expect(text()).toBe('point-of-hue:{"memoryPhaseTimerSeconds":10}');
  });

  it('updates live on a CONFIGURATION_UPDATED event', async () => {
    const client: SessionConfigurationClient = {
      getSessionConfiguration: vi.fn().mockResolvedValue({ gameId: 'fishbowl', selectedSettings: { roundCount: 3 } }),
    };
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, sessionConfigTopic, {
        params: { sessionId: 'session-1' },
        payload: { kind: 'CONFIGURATION_UPDATED', sessionId: 'session-1', gameId: 'fishbowl', selectedSettings: { roundCount: 4 } },
      });
    });

    expect(text()).toBe('fishbowl:{"roundCount":4}');
  });
});
