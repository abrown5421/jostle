import { createInMemoryTransport, createPubSub, notificationFeedTopic, publishTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotificationCenter } from './use-notification-center.js';
import type { NotificationCenterClient } from './notification-center-client.js';
import type { NotificationCenterController } from './use-notification-center.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function createFakeClient(overrides: Partial<NotificationCenterClient> = {}): NotificationCenterClient {
  return {
    fetchNotifications: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('useNotificationCenter', () => {
  let container: HTMLDivElement;
  let root: Root;
  let pubsub: PubSub;
  let controller: NotificationCenterController | undefined;

  function Probe({ client }: { client: NotificationCenterClient }) {
    controller = useNotificationCenter({ pubsub, recipientId: 'user-1', client });
    return (
      <div>
        <span data-testid="unread">{controller.unreadCount}</span>
        <span data-testid="items">{controller.items.map((item) => item.id).join(',')}</span>
      </div>
    );
  }

  beforeEach(() => {
    pubsub = createPubSub({ transport: createInMemoryTransport() });
    controller = undefined;
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('seeds state from the initial fetch and derives unread count', async () => {
    const client = createFakeClient({
      fetchNotifications: vi.fn().mockResolvedValue({
        items: [
          { id: '1', type: 'friend_request', readStatus: false, payload: {}, createdAt: '2026-01-01T00:00:00.000Z' },
          { id: '2', type: 'game_invite', readStatus: true, payload: {}, createdAt: '2026-01-02T00:00:00.000Z' },
        ],
        nextCursor: null,
      }),
    });

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    expect(container.querySelector('[data-testid="unread"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="items"]')?.textContent).toBe('2,1');
  });

  it('prepends a live-pushed notification received over the feed topic', async () => {
    const client = createFakeClient();
    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await publishTopic(pubsub, notificationFeedTopic, {
        params: { recipientId: 'user-1' },
        payload: { id: 'live-1', type: 'system_alert', readStatus: false, payload: {}, createdAt: '2026-01-03T00:00:00.000Z' },
      });
    });

    expect(container.querySelector('[data-testid="items"]')?.textContent).toBe('live-1');
    expect(container.querySelector('[data-testid="unread"]')?.textContent).toBe('1');
  });

  it('marks an item read optimistically and calls the client', async () => {
    const client = createFakeClient({
      fetchNotifications: vi.fn().mockResolvedValue({
        items: [{ id: '1', type: 'friend_request', readStatus: false, payload: {}, createdAt: '2026-01-01T00:00:00.000Z' }],
        nextCursor: null,
      }),
    });

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await controller!.markAsRead(['1']);
    });

    expect(container.querySelector('[data-testid="unread"]')?.textContent).toBe('0');
    expect(client.markAsRead).toHaveBeenCalledWith({ recipientId: 'user-1', ids: ['1'] });
  });

  it('marks everything read via markAllAsRead', async () => {
    const client = createFakeClient({
      fetchNotifications: vi.fn().mockResolvedValue({
        items: [
          { id: '1', type: 'a', readStatus: false, payload: {}, createdAt: '2026-01-01T00:00:00.000Z' },
          { id: '2', type: 'b', readStatus: false, payload: {}, createdAt: '2026-01-02T00:00:00.000Z' },
        ],
        nextCursor: null,
      }),
    });

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    await act(async () => {
      await controller!.markAllAsRead();
    });

    expect(container.querySelector('[data-testid="unread"]')?.textContent).toBe('0');
    expect(client.markAllAsRead).toHaveBeenCalledWith({ recipientId: 'user-1' });
  });

  it('loads the next page using the stored cursor and reports hasMore', async () => {
    const client = createFakeClient({
      fetchNotifications: vi
        .fn()
        .mockResolvedValueOnce({
          items: [{ id: '1', type: 'a', readStatus: true, payload: {}, createdAt: '2026-01-02T00:00:00.000Z' }],
          nextCursor: 'cursor-1',
        })
        .mockResolvedValueOnce({
          items: [{ id: '2', type: 'b', readStatus: true, payload: {}, createdAt: '2026-01-01T00:00:00.000Z' }],
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(<Probe client={client} />);
    });

    expect(controller!.hasMore).toBe(true);

    await act(async () => {
      await controller!.loadMore();
    });

    expect(client.fetchNotifications).toHaveBeenLastCalledWith({ recipientId: 'user-1', before: 'cursor-1' });
    expect(controller!.hasMore).toBe(false);
    expect(container.querySelector('[data-testid="items"]')?.textContent).toBe('1,2');
  });
});
