import React from 'react';
import { Box, Button } from '../../components';
import { NavSlotProps } from './navbar.types';

const NavSlot: React.FC<NavSlotProps> = ({ pages, renderLink }) => {
  return (
    <Box flex align="center" padding="sm" className="h-[56px]">
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
              'mx-1 px-3 py-1.5 rounded-md text-sm font-medium text-surface2-contrast hover:border-accent hover:text-accent transition-colors duration-150',
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default NavSlot;