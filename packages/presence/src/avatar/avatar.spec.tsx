import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Avatar } from './avatar.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('Avatar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders initials when no image is given', () => {
    act(() => {
      root.render(<Avatar name="Ada Lovelace" />);
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('AL');
  });

  it('renders the image when one is given', () => {
    act(() => {
      root.render(<Avatar name="Ada Lovelace" imageUrl="https://example.com/ada.png" />);
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/ada.png');
    expect(img.alt).toBe('Ada Lovelace');
  });

  it('renders no presence badge when status is omitted', () => {
    act(() => {
      root.render(<Avatar name="Ada Lovelace" />);
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('places the presence badge in the bottom-right corner when status is given', () => {
    act(() => {
      root.render(<Avatar name="Ada Lovelace" status="online" />);
    });
    const badgeWrapper = container.querySelector('.absolute') as HTMLElement;
    expect(badgeWrapper.className).toContain('absolute');
    expect(badgeWrapper.className).toContain('bottom-0');
    expect(badgeWrapper.className).toContain('right-0');
  });
});
