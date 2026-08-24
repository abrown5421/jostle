import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './modal.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const click = (el: Element) =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('Modal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders nothing while closed', () => {
    act(() => {
      root.render(
        <Modal open={false} onClose={vi.fn()} title="Update Avatar">
          content
        </Modal>,
      );
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the title, children, and footer while open', () => {
    act(() => {
      root.render(
        <Modal
          open
          onClose={vi.fn()}
          title="Update Avatar"
          footer={<button>Save</button>}
        >
          <p>body</p>
        </Modal>,
      );
    });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(container.textContent).toContain('Update Avatar');
    expect(container.textContent).toContain('body');
    expect(container.textContent).toContain('Save');
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <Modal open onClose={onClose} title="Update Avatar">
          content
        </Modal>,
      );
    });
    const backdrop = container.querySelector(
      '.fixed.inset-0.z-40',
    ) as HTMLElement;
    act(() => click(backdrop));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <Modal open onClose={onClose} title="Update Avatar">
          content
        </Modal>,
      );
    });
    const closeButton = container.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement;
    act(() => click(closeButton));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <Modal open onClose={onClose} title="Update Avatar">
          content
        </Modal>,
      );
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
