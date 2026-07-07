import React from 'react';
import { Box } from '../../components';
import FooterNavRow from './footer-nav-row';
import FooterSecondaryRow from './footer-secondary-row';
import { FooterProps } from './footer.types';
import type { Page } from '@inithium/types';

export const Footer: React.FC<FooterProps> = ({ pages, footerPages, renderLink }) => {
  const mainPages = pages.filter((page: Page) => page.navigation?.location === 'main');

  return (
    <Box color="surface2" className="w-full">
      <Box flex direction="col" className="px-4 sm:px-6 lg:px-8 py-2">
        <FooterNavRow pages={mainPages} renderLink={renderLink} />
        {footerPages.length > 0 && (
          <FooterSecondaryRow pages={footerPages} renderLink={renderLink} />
        )}
      </Box>
    </Box>
  );
};