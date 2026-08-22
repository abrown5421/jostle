import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Container } from './container.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('Container', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('applies layout, color, and spacing classes', () => {
    act(() => {
      root.render(
        <Container
          data-testid="box"
          direction="col"
          horizontalAlign="center"
          verticalAlign="between"
          gap={4}
          padding={2}
          backgroundColor="surface-secondary"
          textColor="content-primary"
          borderColor="accent"
        />,
      );
    });
    const el = container.querySelector('[data-testid="box"]') as HTMLElement;
    const classes = el.className.split(' ');
    expect(classes).toEqual(
      expect.arrayContaining([
        'flex',
        'flex-col',
        'justify-between', // verticalAlign is the main axis when direction=col
        'items-center', // horizontalAlign is the cross axis when direction=col
        'gap-4',
        'p-2',
        'bg-surface-secondary',
        'text-content-primary',
        'border',
        'border-accent',
      ]),
    );
  });

  it('lets a consumer className override a conflicting internal utility', () => {
    act(() => {
      root.render(<Container data-testid="box" backgroundColor="primary" className="bg-red-500" />);
    });
    const el = container.querySelector('[data-testid="box"]') as HTMLElement;
    expect(el.className).not.toContain('bg-primary');
    expect(el.className).toContain('bg-red-500');
  });

  it('lets a consumer style override an internal style (animation timing vars)', () => {
    act(() => {
      root.render(
        <Container
          data-testid="box"
          animation={{ name: 'fadeIn', duration: 500 }}
          style={{ '--animate-duration': '999ms' } as React.CSSProperties}
        />,
      );
    });
    const el = container.querySelector('[data-testid="box"]') as HTMLElement;
    expect(el.style.getPropertyValue('--animate-duration')).toBe('999ms');
  });
});
