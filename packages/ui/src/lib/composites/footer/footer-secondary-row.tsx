import React from 'react';
import { Box } from '../../components';
import { FooterSecondaryRowProps } from './footer.types';

const FOUNDED_YEAR = 2024;

const FooterSecondaryRow: React.FC<FooterSecondaryRowProps> = ({ pages, renderLink }) => {
  const currentYear = new Date().getFullYear();
  const copyrightRange = currentYear > FOUNDED_YEAR ? `${FOUNDED_YEAR}–${currentYear}` : `${FOUNDED_YEAR}`;

  return (
    <Box flex align="center" className="gap-x-4 gap-y-1 py-2 border-t border-surface3">
      <span className="text-xs font-normal text-surface4-contrast">
        © {copyrightRange} Inithium. All rights reserved.
      </span>
      
      {pages.map((page) => (
        <React.Fragment key={page.key}>
          {renderLink(
            page,
            'text-xs font-normal text-surface4-contrast hover:text-accent transition-colors duration-150',
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default FooterSecondaryRow;