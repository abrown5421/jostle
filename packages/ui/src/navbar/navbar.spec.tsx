import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './navbar.js';
import type { NavLinkItem, UserProfile } from './types.js';

const navLinks: NavLinkItem[] = [{ label: 'Home', href: '/' }];
const profileLinks: NavLinkItem[] = [{ label: 'Profile', href: '/profile/1' }];
const user: UserProfile = { id: '1', name: 'Jamie Doe' };

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const fireAnimationEnd = (el: Element) => el.dispatchEvent(new Event('animationend', { bubbles: true }));

describe('Navbar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  describe('unauthenticated', () => {
    it('calls onLogin directly (no drawer) when the Login button is clicked', () => {
      const onLogin = vi.fn();
      act(() => {
        root.render(
          <Navbar
            logoSrc="/logo.png"
            appName="Jostle"
            navLinks={navLinks}
            profileLinks={profileLinks}
            isAuthenticated={false}
            onLogin={onLogin}
            onLogout={vi.fn()}
          />,
        );
      });

      const loginButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Log In')!;
      act(() => click(loginButton));

      expect(onLogin).toHaveBeenCalledTimes(1);
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('opens the drawer with nav links only when the hamburger is clicked', () => {
      act(() => {
        root.render(
          <Navbar
            logoSrc="/logo.png"
            appName="Jostle"
            navLinks={navLinks}
            profileLinks={profileLinks}
            isAuthenticated={false}
            onLogin={vi.fn()}
            onLogout={vi.fn()}
          />,
        );
      });

      act(() => click(container.querySelector('button[aria-label="Open menu"]')!));

      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).not.toBeNull();
      expect(dialog.textContent).toContain('Home');
      expect(dialog.textContent).not.toContain('Profile');
      expect(dialog.textContent).not.toContain('Log Out');
    });
  });

  describe('authenticated', () => {
    function renderAuthenticated(onLogout = vi.fn()) {
      act(() => {
        root.render(
          <Navbar
            logoSrc="/logo.png"
            appName="Jostle"
            navLinks={navLinks}
            profileLinks={profileLinks}
            isAuthenticated={true}
            user={user}
            onLogin={vi.fn()}
            onLogout={onLogout}
          />,
        );
      });
      return onLogout;
    }

    it('shows the avatar with initials when there is no avatarUrl', () => {
      renderAuthenticated();
      const avatar = container.querySelector('button[aria-label="Open menu for Jamie Doe"]') as HTMLElement;
      expect(avatar.textContent).toBe('JD');
    });

    it('opens the drawer with both nav links and profile links', () => {
      renderAuthenticated();
      act(() => click(container.querySelector('button[aria-label="Open menu for Jamie Doe"]')!));

      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog.textContent).toContain('Home');
      expect(dialog.textContent).toContain('Profile');
      expect(dialog.textContent).toContain('Log Out');
    });

    it('calls onLogout and closes the drawer when Log Out is clicked', () => {
      const onLogout = renderAuthenticated();
      act(() => click(container.querySelector('button[aria-label="Open menu for Jamie Doe"]')!));

      const logoutButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Log Out')!;
      act(() => click(logoutButton));

      expect(onLogout).toHaveBeenCalledTimes(1);
      // Drawer plays its exit animation before unmounting.
      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      act(() => fireAnimationEnd(dialog));
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  it('intercepts link clicks via onNavigate instead of a real navigation, and closes the drawer', () => {
    const onNavigate = vi.fn();
    act(() => {
      root.render(
        <Navbar
          logoSrc="/logo.png"
          appName="Jostle"
          navLinks={navLinks}
          profileLinks={profileLinks}
          isAuthenticated={false}
          onLogin={vi.fn()}
          onLogout={vi.fn()}
          onNavigate={onNavigate}
        />,
      );
    });

    act(() => click(container.querySelector('button[aria-label="Open menu"]')!));
    const link = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === 'Home')!;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => link.dispatchEvent(event));

    expect(onNavigate).toHaveBeenCalledWith('/');
    expect(event.defaultPrevented).toBe(true);
  });

  it('closes the drawer on Escape', () => {
    act(() => {
      root.render(
        <Navbar
          logoSrc="/logo.png"
          appName="Jostle"
          navLinks={navLinks}
          profileLinks={profileLinks}
          isAuthenticated={false}
          onLogin={vi.fn()}
          onLogout={vi.fn()}
        />,
      );
    });

    act(() => click(container.querySelector('button[aria-label="Open menu"]')!));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    act(() => fireAnimationEnd(dialog));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
