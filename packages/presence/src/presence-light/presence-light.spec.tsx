import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STATUS_INDICATOR_CONFIG } from '../config/index.js';
import { PresenceLight } from './presence-light.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('PresenceLight', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('colors the dot by status and labels the tooltip to match', () => {
    act(() => {
      root.render(<PresenceLight status="busy" />);
    });
    const dot = container.querySelector('[role="status"]') as HTMLElement;
    const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;

    expect(dot.className).toContain(STATUS_INDICATOR_CONFIG.busy.indicatorClassName);
    expect(tooltip.textContent).toBe('Busy');
    expect(dot.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('keeps the tooltip out of view until the dot is focused, then hides it again on blur', () => {
    act(() => {
      root.render(<PresenceLight status="online" />);
    });
    const dot = container.querySelector('[role="status"]') as HTMLElement;
    const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;

    expect(tooltip.className).toContain('opacity-0');

    act(() => {
      dot.focus();
    });
    expect(tooltip.className).toContain('opacity-100');

    act(() => {
      dot.blur();
    });
    expect(tooltip.className).toContain('opacity-0');
  });

  it('is focusable so keyboard users can reach the tooltip', () => {
    act(() => {
      root.render(<PresenceLight status="offline" />);
    });
    const dot = container.querySelector('[role="status"]') as HTMLElement;
    expect(dot.tabIndex).toBe(0);
  });
});
