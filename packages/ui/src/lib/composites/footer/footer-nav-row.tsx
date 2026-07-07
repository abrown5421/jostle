import React from 'react';
import { Box, Button } from '../../components';
import { FooterNavRowProps } from './footer.types';

const FooterNavRow: React.FC<FooterNavRowProps> = ({ pages, renderLink }) => {
  return (
    <Box flex className="gap-x-2 gap-y-1 py-3">
      {pages.map((page) => {
        if (page.navigation?.isButton) {
          return (
            <Button
              key={page.key}
              type="submit"
              color="primary"
              variant="solid"
              size="sm"
              rounded
              className="mx-1"
            >
              {renderLink(page)}
            </Button>
          );
        }
        return (
          <React.Fragment key={page.key}>
            {renderLink(
              page,
              'px-3 py-1.5 rounded-md text-sm font-medium text-surface2-contrast hover:text-accent transition-colors duration-150',
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default FooterNavRow;