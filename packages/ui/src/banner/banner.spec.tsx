import { DEFAULT_BANNER_CONFIG } from '@jostle/profile-appearance';
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

  it('renders the triangle mesh generated from the pattern config', () => {
    act(() => {
      root.render(<Banner pattern={DEFAULT_BANNER_CONFIG} />);
    });
    expect(container.querySelectorAll('svg polygon').length).toBeGreaterThan(0);
  });

  it('renders an edit button that calls onEdit when clicked', () => {
    const onEdit = vi.fn();
    act(() => {
      root.render(<Banner pattern={DEFAULT_BANNER_CONFIG} onEdit={onEdit} />);
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
      root.render(<Banner pattern={DEFAULT_BANNER_CONFIG} />);
    });
    expect(
      container.querySelector('button[aria-label="Edit banner"]'),
    ).toBeNull();
  });
});
