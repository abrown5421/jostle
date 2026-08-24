import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Banner } from './banner.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const click = (el: Element) =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('Banner', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows the triangle pattern placeholder when there is no image', () => {
    act(() => {
      root.render(<Banner />);
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg pattern')).not.toBeNull();
  });

  it('renders the image instead of the placeholder when imageUrl is set', () => {
    act(() => {
      root.render(<Banner imageUrl="https://example.com/banner.png" />);
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/banner.png');
    expect(container.querySelector('svg pattern')).toBeNull();
  });

  it('renders an edit button that calls onEdit when clicked', () => {
    const onEdit = vi.fn();
    act(() => {
      root.render(<Banner onEdit={onEdit} />);
    });
    const editButton = container.querySelector(
      'button[aria-label="Edit banner"]',
    ) as HTMLButtonElement;
    expect(editButton).not.toBeNull();
    act(() => click(editButton));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('omits the edit button when onEdit is not provided', () => {
    act(() => {
      root.render(<Banner />);
    });
    expect(
      container.querySelector('button[aria-label="Edit banner"]'),
    ).toBeNull();
  });
});
