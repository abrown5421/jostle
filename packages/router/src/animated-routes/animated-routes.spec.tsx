import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnimatedRoutes } from './animated-routes.js';
import type { PageRoute } from './types.js';

const routes: PageRoute[] = [
  {
    path: '/',
    element: <div data-testid="page">home</div>,
    transition: { enter: { name: 'fadeIn' }, exit: { name: 'fadeOut' } },
  },
  {
    path: '/login',
    element: <div data-testid="page">login</div>,
    transition: { enter: { name: 'fadeInUp' }, exit: { name: 'fadeOutDown' } },
  },
];

function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" data-testid="nav" onClick={() => navigate(to)}>
      go
    </button>
  );
}

function Fixture({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <NavigateButton to="/login" />
      <AnimatedRoutes routes={routes} />
    </MemoryRouter>
  );
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const fireAnimationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));

describe('AnimatedRoutes', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('plays the matched route\'s own enter animation on initial mount', () => {
    act(() => root.render(<Fixture initialPath="/" />));

    const wrapper = container.querySelector('[data-testid="page"]')!.parentElement as HTMLElement;
    expect(wrapper.className).toBe('animate__animated animate__fadeIn');
    expect(wrapper.textContent).toBe('home');
  });

  it('exits the old page before mounting the new one, using each route\'s own animation', () => {
    act(() => root.render(<Fixture initialPath="/" />));
    const wrapper = () => container.querySelector('[data-testid="page"]')!.parentElement as HTMLElement;

    // Settle the initial enter.
    act(() => fireAnimationEnd(wrapper()));

    act(() => container.querySelector('[data-testid="nav"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    // Still showing the OLD page, now playing ITS exit animation.
    expect(wrapper().textContent).toBe('home');
    expect(wrapper().className).toBe('animate__animated animate__fadeOut');

    // Exit finishes -> content swaps to the new page and its enter plays.
    act(() => fireAnimationEnd(wrapper()));
    expect(wrapper().textContent).toBe('login');
    expect(wrapper().className).toBe('animate__animated animate__fadeInUp');
  });

  it('renders nothing for a path that matches no route', () => {
    act(() => root.render(<Fixture initialPath="/nowhere" />));
    expect(container.querySelector('[data-testid="page"]')).toBeNull();
  });
});
