import type { RefObject } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnimationTrigger } from './useAnimationTrigger.js';
import { useEnterExitAnimation } from './useEnterExitAnimation.js';

function TriggerFixture({
  onReady,
}: {
  onReady: (controller: ReturnType<typeof useAnimationTrigger>) => void;
}) {
  const trigger = useAnimationTrigger();
  onReady(trigger);
  return (
    <div
      ref={trigger.ref as RefObject<HTMLDivElement>}
      className={trigger.className}
      style={trigger.style}
      data-testid="trigger-fixture"
    />
  );
}

function EnterExitFixture({
  visible,
  onEnterComplete,
  onExitComplete,
}: {
  visible: boolean;
  onEnterComplete: () => void;
  onExitComplete: () => void;
}) {
  const { shouldRender, ref, className, style } = useEnterExitAnimation(visible, {
    enter: { name: 'fadeIn', onComplete: onEnterComplete },
    exit: { name: 'fadeOut', onComplete: onExitComplete },
  });
  if (!shouldRender) return null;
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={className}
      style={style}
      data-testid="enter-exit-fixture"
    />
  );
}

function mountFixture() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const fireAnimationEnd = (node: Element) => {
  node.dispatchEvent(new Event('animationend', { bubbles: true }));
};

describe('useAnimationTrigger', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mountFixture());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('applies animate.css classes + CSS timing vars on play, then clears them on animationend and calls onComplete', () => {
    let controller!: ReturnType<typeof useAnimationTrigger>;
    act(() => {
      root.render(<TriggerFixture onReady={(c) => (controller = c)} />);
    });

    const onComplete = vi.fn();
    act(() => {
      controller.play({ name: 'bounce', duration: 500, onComplete });
    });

    const node = container.querySelector('[data-testid="trigger-fixture"]') as HTMLElement;
    expect(node.className).toBe('animate__animated animate__bounce');
    expect(node.style.getPropertyValue('--animate-duration')).toBe('500ms');
    expect(controller.isAnimating).toBe(true);

    act(() => fireAnimationEnd(node));

    expect(node.className).toBe('');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('ignores animationend events that bubble up from a different element', () => {
    let controller!: ReturnType<typeof useAnimationTrigger>;
    act(() => {
      root.render(<TriggerFixture onReady={(c) => (controller = c)} />);
    });

    const onComplete = vi.fn();
    act(() => controller.play({ name: 'flash', onComplete }));

    const foreignNode = document.createElement('span');
    container.appendChild(foreignNode);
    act(() => fireAnimationEnd(foreignNode));

    expect(onComplete).not.toHaveBeenCalled();
    expect(controller.isAnimating).toBe(true);
  });
});

describe('useEnterExitAnimation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mountFixture());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('stays unmounted while hidden, plays enter on show, and only unmounts after the exit animation finishes', () => {
    const onEnterComplete = vi.fn();
    const onExitComplete = vi.fn();

    act(() => {
      root.render(
        <EnterExitFixture
          visible={false}
          onEnterComplete={onEnterComplete}
          onExitComplete={onExitComplete}
        />,
      );
    });
    expect(container.querySelector('[data-testid="enter-exit-fixture"]')).toBeNull();

    act(() => {
      root.render(
        <EnterExitFixture
          visible={true}
          onEnterComplete={onEnterComplete}
          onExitComplete={onExitComplete}
        />,
      );
    });
    const enteringNode = container.querySelector(
      '[data-testid="enter-exit-fixture"]',
    ) as HTMLElement;
    expect(enteringNode).not.toBeNull();
    expect(enteringNode.className).toBe('animate__animated animate__fadeIn');

    act(() => fireAnimationEnd(enteringNode));
    expect(onEnterComplete).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="enter-exit-fixture"]')?.className).toBe('');

    act(() => {
      root.render(
        <EnterExitFixture
          visible={false}
          onEnterComplete={onEnterComplete}
          onExitComplete={onExitComplete}
        />,
      );
    });
    const exitingNode = container.querySelector(
      '[data-testid="enter-exit-fixture"]',
    ) as HTMLElement;
    // Still mounted mid-exit — the base component never had to know it was exiting.
    expect(exitingNode).not.toBeNull();
    expect(exitingNode.className).toBe('animate__animated animate__fadeOut');
    expect(onExitComplete).not.toHaveBeenCalled();

    act(() => fireAnimationEnd(exitingNode));
    expect(onExitComplete).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="enter-exit-fixture"]')).toBeNull();
  });
});
