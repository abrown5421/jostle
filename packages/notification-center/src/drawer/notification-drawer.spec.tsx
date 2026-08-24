import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationDrawer } from './notification-drawer.js';
import type { NotificationItem } from '../types/index.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: '1',
    type: 'friend_request',
    readStatus: false,
    payload: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationDrawer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows an empty state when there are no notifications', () => {
    act(() => {
      root.render(
        <NotificationDrawer open={true} onClose={vi.fn()} notifications={[]} onMarkAsRead={vi.fn()} onMarkAllAsRead={vi.fn()} />,
      );
    });

    expect(container.textContent).toContain("You're all caught up.");
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('renders each notification, humanizing its type by default', () => {
    act(() => {
      root.render(
        <NotificationDrawer
          open={true}
          onClose={vi.fn()}
          notifications={[item({ id: '1', type: 'friend_request' }), item({ id: '2', type: 'game_invite', readStatus: true })]}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('Friend request');
    expect(container.textContent).toContain('Game invite');
  });

  it('shows a mark-read control only for unread items and calls onMarkAsRead with that id', () => {
    const onMarkAsRead = vi.fn();
    act(() => {
      root.render(
        <NotificationDrawer
          open={true}
          onClose={vi.fn()}
          notifications={[item({ id: '1', readStatus: false }), item({ id: '2', readStatus: true })]}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={vi.fn()}
        />,
      );
    });

    const markReadButtons = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Mark read');
    expect(markReadButtons).toHaveLength(1);

    act(() => markReadButtons[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onMarkAsRead).toHaveBeenCalledWith(['1']);
  });

  it('calls onMarkAllAsRead from the mark-all control', () => {
    const onMarkAllAsRead = vi.fn();
    act(() => {
      root.render(
        <NotificationDrawer
          open={true}
          onClose={vi.fn()}
          notifications={[item({ id: '1' })]}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={onMarkAllAsRead}
        />,
      );
    });

    const markAll = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Mark all as read')!;
    act(() => markAll.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('uses renderPayload when provided instead of the default type label', () => {
    act(() => {
      root.render(
        <NotificationDrawer
          open={true}
          onClose={vi.fn()}
          notifications={[item({ id: '1', type: 'friend_request', payload: { initiatorName: 'Ada' } })]}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          renderPayload={(notification) => `Custom: ${(notification.payload as { initiatorName: string }).initiatorName}`}
        />,
      );
    });

    expect(container.textContent).toContain('Custom: Ada');
    expect(container.textContent).not.toContain('Friend request');
  });

  it('shows a load-more control only when hasMore and onLoadMore are both provided', () => {
    const onLoadMore = vi.fn();
    act(() => {
      root.render(
        <NotificationDrawer
          open={true}
          onClose={vi.fn()}
          notifications={[item({ id: '1' })]}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          hasMore={true}
          onLoadMore={onLoadMore}
        />,
      );
    });

    const loadMore = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Load more')!;
    act(() => loadMore.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
