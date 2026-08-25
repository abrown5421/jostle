import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar } from './avatar.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const click = (el: Element) =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

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

  it('shows initials when there is no image', () => {
    act(() => {
      root.render(<Avatar name="Super Admin" />);
    });
    expect(container.textContent).toContain('SA');
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the image instead of initials when imageUrl is set', () => {
    act(() => {
      root.render(
        <Avatar name="Super Admin" imageUrl="https://example.com/a.png" />,
      );
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/a.png');
  });

  it('renders an edit button that calls onEdit when clicked', () => {
    const onEdit = vi.fn();
    act(() => {
      root.render(<Avatar name="Super Admin" onEdit={onEdit} />);
    });
    const editButton = container.querySelector(
      'button[aria-label="Edit avatar"]',
    ) as HTMLButtonElement;
    expect(editButton).not.toBeNull();
    act(() => click(editButton));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('omits the edit button when onEdit is not provided', () => {
    act(() => {
      root.render(<Avatar name="Super Admin" />);
    });
    expect(
      container.querySelector('button[aria-label="Edit avatar"]'),
    ).toBeNull();
  });

  it('applies initialsFontFamily to the fallback initials', () => {
    act(() => {
      root.render(
        <Avatar name="Super Admin" initialsFontFamily="Jostle Primary" />,
      );
    });
    const span = container.querySelector('span > span') as HTMLSpanElement;
    expect(span.style.fontFamily).toBe('Jostle Primary');
  });
});
