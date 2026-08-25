import type { ReactNode, Ref } from 'react';
import type { AnimationConfig } from '../animation/index.js';
import type { AnimatableProps, BlowoffProps } from '../shared/index.js';

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface DrawerTransitionConfig {
  enter: AnimationConfig;
  exit: AnimationConfig;
}

export interface NavbarProps extends BlowoffProps, AnimatableProps {
  logoSrc: string;
  logoAlt?: string;
  appName: string;
  /** CSS font-family for the appName text, e.g. from @jostle/assets fonts. */
  appNameFontFamily?: string;
  /** CSS font-family for the avatar's fallback initials, e.g. from @jostle/assets fonts. */
  avatarInitialsFontFamily?: string;
  /** Primary site links — desktop-visible at lg, drawer-only below it. */
  navLinks: NavLinkItem[];
  /** Links shown in the drawer only while authenticated (e.g. Profile). */
  profileLinks: NavLinkItem[];
  isAuthenticated: boolean;
  /** Required once isAuthenticated is true — drives the avatar + greeting. */
  user?: UserProfile;
  /** Optional badge rendered over the avatar's bottom-right corner (e.g. a presence indicator). */
  avatarBadge?: ReactNode;
  /** Optional trigger rendered immediately left of the avatar while authenticated (e.g. a notification bell). */
  notificationTrigger?: ReactNode;
  onLogin: () => void;
  onLogout: () => void;
  /**
   * Called instead of a real navigation when a link is clicked (wire this
   * to your router's navigate function for SPA routing). If omitted, links
   * are plain <a href> and navigate normally.
   */
  onNavigate?: (href: string) => void;
  /** @default slideInRight / slideOutRight */
  drawerTransition?: DrawerTransitionConfig;
  ref?: Ref<HTMLElement>;
}
