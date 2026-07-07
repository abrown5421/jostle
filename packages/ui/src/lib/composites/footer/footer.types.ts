import type { ReactNode } from 'react';
import type { Page } from '@inithium/types';

export interface FooterProps {
  pages: Page[];
  footerPages: Page[];
  renderLink: (page: Page, className?: string) => ReactNode;
}

export interface FooterNavRowProps {
  pages: Page[];
  renderLink: (page: Page, className?: string) => ReactNode;
}

export interface FooterSecondaryRowProps {
  pages: Page[];
  renderLink: (page: Page, className?: string) => ReactNode;
}