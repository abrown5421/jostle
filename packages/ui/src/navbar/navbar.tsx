import type { MouseEvent, Ref } from 'react';
import { useState } from 'react';
import { useAnimationProp } from '../animation/index.js';
import { Button } from '../button/index.js';
import { cn, mergeRefs } from '../shared/index.js';
import { Drawer } from './drawer.js';
import type { NavbarProps, NavLinkItem, UserProfile } from './types.js';

const LINK_CLASS = 'text-content-primary transition-colors hover:text-primary';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function AvatarButton({ user, onClick }: { user: UserProfile; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open menu for ${user.name}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        initialsFromName(user.name)
      )}
    </button>
  );
}

function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Open menu" className="text-content-primary">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </button>
  );
}

/**
 * Responsive header + slideout drawer. Layout matrix (see types.ts for the
 * exact prop contract):
 *
 * | Viewport   | Auth state      | Trigger  | Drawer content                |
 * |------------|-----------------|----------|--------------------------------|
 * | lg+        | authenticated   | Avatar   | profileLinks only              |
 * | lg+        | unauthenticated | Login    | (none — onLogin fires directly)|
 * | below lg   | authenticated   | Avatar   | navLinks + profileLinks        |
 * | below lg   | unauthenticated | Hamburger| navLinks only                  |
 *
 * Stays router-agnostic: links render as real <a href> (accessible, right-
 * click-to-open-in-new-tab works) and only call onNavigate — wire that to
 * your router's navigate function for client-side routing.
 */
export function Navbar({
  logoSrc,
  logoAlt,
  appName,
  navLinks,
  profileLinks,
  isAuthenticated,
  user,
  onLogin,
  onLogout,
  onNavigate,
  drawerTransition,
  animation,
  className,
  style,
  ref,
}: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const animationProp = useAnimationProp(animation);

  const renderLink = (link: NavLinkItem) => (
    <a
      key={link.href}
      href={link.href}
      className={LINK_CLASS}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (onNavigate) {
          event.preventDefault();
          onNavigate(link.href);
        }
        setDrawerOpen(false);
      }}
    >
      {link.label}
    </a>
  );

  return (
    <nav
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLElement>)}
      className={cn(
        'flex items-center justify-between border-b border-surface-tertiary bg-surface-secondary px-6 py-4',
        animationProp.className,
        className,
      )}
      style={{ ...animationProp.style, ...style }}
    >
      <div className="flex items-center gap-2">
        <img src={logoSrc} alt={logoAlt ?? appName} className="h-8 w-8" />
        <span className="text-lg font-bold text-content-primary">{appName}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-6 lg:flex">{navLinks.map(renderLink)}</div>

        {isAuthenticated ? (
          user && <AvatarButton user={user} onClick={() => setDrawerOpen(true)} />
        ) : (
          <>
            <span className="hidden lg:block">
              <Button color="primary" onClick={onLogin}>
                Log In
              </Button>
            </span>
            <span className="lg:hidden">
              <HamburgerButton onClick={() => setDrawerOpen(true)} />
            </span>
          </>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} transition={drawerTransition}>
        {isAuthenticated && user ? (
          <>
            <p className="text-sm font-medium text-content-secondary">Welcome, {user.name}</p>
            <div className="flex flex-col gap-4 lg:hidden">{navLinks.map(renderLink)}</div>
            <div className="flex flex-col gap-4 border-t border-surface-tertiary pt-4">
              {profileLinks.map(renderLink)}
            </div>
            <Button
              color="secondary"
              className="mt-auto bg-red-600 border-red-600 hover:bg-transparent hover:text-red-600"
              onClick={() => {
                onLogout();
                setDrawerOpen(false);
              }}
            >
              Log Out
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-4">{navLinks.map(renderLink)}</div>
        )}
      </Drawer>
    </nav>
  );
}
