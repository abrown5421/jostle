import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-qr-code', () => ({
  default: (props: { value: string; size: number }) => (
    <svg data-testid="qr" data-value={props.value} data-size={props.size} />
  ),
}));

import { QrCode } from './qr-code.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('QrCode', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('encodes a join URL built from the current origin and the given code', () => {
    act(() => {
      root.render(<QrCode joinCode="ABC123" />);
    });

    const qr = container.querySelector('[data-testid="qr"]') as HTMLElement;
    expect(qr.dataset.value).toBe(`${window.location.origin}/join?code=ABC123`);
  });

  it('passes a custom size through', () => {
    act(() => {
      root.render(<QrCode joinCode="ABC123" size={240} />);
    });

    const qr = container.querySelector('[data-testid="qr"]') as HTMLElement;
    expect(qr.dataset.size).toBe('240');
  });
});
