import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('StatusBadge', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('labels a connected integration', () => {
    act(() => {
      root.render(<StatusBadge connected />);
    });
    expect(container.textContent).toBe('Connected');
  });

  it('labels an unconnected integration', () => {
    act(() => {
      root.render(<StatusBadge connected={false} />);
    });
    expect(container.textContent).toBe('Not Connected');
  });
});
