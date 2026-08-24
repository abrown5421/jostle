import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './notification-bell.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('NotificationBell', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders no badge and a plain label when there are no unread notifications', () => {
    act(() => {
      root.render(<NotificationBell unreadCount={0} onClick={vi.fn()} />);
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Notifications');
    expect(container.textContent).toBe('');
  });

  it('shows the unread count in the badge and an updated label', () => {
    act(() => {
      root.render(<NotificationBell unreadCount={3} onClick={vi.fn()} />);
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Notifications, 3 unread');
    expect(container.textContent).toBe('3');
  });

  it('caps the displayed badge at 9+', () => {
    act(() => {
      root.render(<NotificationBell unreadCount={42} onClick={vi.fn()} />);
    });

    expect(container.textContent).toBe('9+');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(<NotificationBell unreadCount={0} onClick={onClick} />);
    });

    act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
