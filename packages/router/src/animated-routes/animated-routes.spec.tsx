import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useNavigate, useParams } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnimatedRoutes } from './animated-routes.js';
import type { PageRoute } from './types.js';

function ProfilePage() {
  const { id } = useParams();
  return <div data-testid="page">profile-{id}</div>;
}

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
  {
    path: '/profile/:id',
    element: <ProfilePage />,
    transition: { enter: { name: 'fadeIn' }, exit: { name: 'fadeOut' } },
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

  it('never commits the new page without its enter class already applied (no unanimated flash)', () => {
    // A regression test for the exact bug: the final settled className
    // after act() flushes everything looks right either way, because the
    // buggy version's extra commit (className briefly '', new content
    // already swapped in) happens in a synchronous chain that's invisible
    // to act()-flushed assertions in this test environment (real browsers
    // paint the intermediate frame; jsdom + our synchronous rAF stub
    // don't yield between them). A MutationObserver sees every individual
    // class-attribute commit, in order, regardless of how fast they
    // happen — that's what actually catches the flash.
    act(() => root.render(<Fixture initialPath="/" />));
    const wrapper = () => container.querySelector('[data-testid="page"]')!.parentElement as HTMLElement;
    act(() => fireAnimationEnd(wrapper()));

    const observer = new MutationObserver(() => {});
    observer.observe(wrapper(), { attributes: true, attributeFilter: ['class'], attributeOldValue: true });

    act(() => container.querySelector('[data-testid="nav"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => fireAnimationEnd(wrapper()));

    // MutationRecord.target always reflects the LIVE current value, not a
    // per-record snapshot — the sequence actually visited has to be
    // reconstructed from each record's oldValue (the state right before
    // that mutation) plus the final live value.
    const records = observer.takeRecords();
    observer.disconnect();
    const visited = [...records.map((record) => record.oldValue), wrapper().className];

    // Exactly two transitions: idle -> exiting, exiting -> entering. If the
    // old (buggy) implementation were in place there'd be a third,
    // "exiting -> '' -> entering", from the content swap landing without
    // its enter class for a commit.
    expect(visited).toEqual([
      '',
      'animate__animated animate__fadeOut',
      'animate__animated animate__fadeInUp',
    ]);
  });

  it('renders nothing for a path that matches no route', () => {
    act(() => root.render(<Fixture initialPath="/nowhere" />));
    expect(container.querySelector('[data-testid="page"]')).toBeNull();
  });

  it('resolves dynamic segments via real react-router context (useParams works)', () => {
    // Regression test: rendering a matched route's element directly
    // (instead of through <Routes location>) never establishes
    // react-router's own route context, so useParams() would silently
    // return {} instead of the actual param.
    act(() => root.render(<Fixture initialPath="/profile/42" />));
    const wrapper = container.querySelector('[data-testid="page"]')!.parentElement as HTMLElement;
    expect(wrapper.textContent).toBe('profile-42');
  });
});
