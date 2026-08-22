import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Slider } from './slider.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('Slider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('paints the completed portion in color and the remainder in a neutral tone, proportional to value', () => {
    act(() => {
      root.render(<Slider value={25} min={0} max={100} setValue={vi.fn()} color="secondary" />);
    });
    const el = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect(el.style.background).toBe(
      'linear-gradient(to right, var(--color-secondary) 0%, var(--color-secondary) 25%, var(--color-surface-tertiary) 25%, var(--color-surface-tertiary) 100%)',
    );
  });

  it('reports the new numeric value on change', () => {
    const setValue = vi.fn();
    act(() => {
      root.render(<Slider value={0} setValue={setValue} />);
    });
    const el = container.querySelector('input[type="range"]') as HTMLInputElement;
    // React tracks the input's last known value internally to detect real
    // changes; setting el.value directly doesn't go through that tracker,
    // so the native setter has to be called explicitly for onChange to fire.
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      nativeSetter.call(el, '42');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(setValue).toHaveBeenCalledWith(42);
  });
});
