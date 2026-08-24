import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KickButton } from './kick-button.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('KickButton', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders a Kick label and calls onClick when clicked', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(<KickButton onClick={onClick} />);
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('Kick');

    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
