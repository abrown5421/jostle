import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Switch } from './switch.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('Switch', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('colors the track by the color prop only while on, and calls setValue with the flipped state on click', () => {
    const setValue = vi.fn();
    act(() => {
      root.render(<Switch value={false} setValue={setValue} color="accent" />);
    });
    const track = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(track.getAttribute('aria-checked')).toBe('false');
    expect(track.className).not.toContain('bg-accent');
    expect(track.className).toContain('bg-surface-tertiary');

    act(() => {
      root.render(<Switch value={true} setValue={setValue} color="accent" />);
    });
    expect(track.className).toContain('bg-accent');
    expect(track.className).not.toContain('bg-surface-tertiary');

    act(() => track.click());
    expect(setValue).toHaveBeenCalledWith(false);
  });

  it('associates the visible label with the control', () => {
    act(() => {
      root.render(<Switch value={false} setValue={vi.fn()} label="Notifications" />);
    });
    expect(container.textContent).toContain('Notifications');
    const label = container.querySelector('label') as HTMLLabelElement;
    const track = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(label.contains(track)).toBe(true);
  });
});
