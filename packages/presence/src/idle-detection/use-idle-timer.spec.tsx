import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleTimer } from './use-idle-timer.js';

function IdleProbe({ thresholdMs, target }: { thresholdMs: number; target: EventTarget }) {
  const isIdle = useIdleTimer(thresholdMs, target);
  return <span data-testid="idle">{String(isIdle)}</span>;
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('useIdleTimer', () => {
  let container: HTMLDivElement;
  let root: Root;
  let target: EventTarget;

  beforeEach(() => {
    vi.useFakeTimers();
    target = new EventTarget();
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function text() {
    return container.querySelector('[data-testid="idle"]')?.textContent;
  }

  it('starts as not idle and flips to idle after the threshold', () => {
    act(() => {
      root.render(<IdleProbe thresholdMs={1000} target={target} />);
    });
    expect(text()).toBe('false');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(text()).toBe('true');
  });

  it('resets to not-idle when activity is dispatched on the target', () => {
    act(() => {
      root.render(<IdleProbe thresholdMs={1000} target={target} />);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(text()).toBe('true');

    act(() => {
      target.dispatchEvent(new Event('mousemove'));
    });
    expect(text()).toBe('false');
  });
});
