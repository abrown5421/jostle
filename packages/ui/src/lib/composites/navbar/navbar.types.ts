import type { ReactNode } from 'react';
import type { Page, User } from '@inithium/types';

export interface NavbarProps {
  pages: Page[];
  profilePages: Page[];
  activeUser?: User | null;
  renderLink: (page: Page, className?: string) => ReactNode;
  onLogout?: () => void;
}

export interface NavSlotProps {
  pages: Page[];
  renderLink: (page: Page, className?: string) => ReactNode;
}

export interface NavbarSlideoutProps {
  mainPages: Page[];
  profilePages: Page[];
  isOpen: boolean;
  onClose: () => void;
  activeUser?: User | null;
  renderLink: (page: Page, className?: string) => ReactNode;
  onLogout?: () => void;
}

export interface UserSlotProps {
  activeUser?: User | null;
  onAvatarClick?: () => void;
}