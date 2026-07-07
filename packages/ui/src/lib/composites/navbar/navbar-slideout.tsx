import React from 'react';
import { Dialog } from '../../components';
import { Box, Button } from '../../components';
import { NavbarSlideoutProps } from './navbar.types';
import { getGreeting } from '@inithium/utils';

const NavbarSlideout: React.FC<NavbarSlideoutProps> = ({
  mainPages,
  profilePages,
  isOpen,
  onClose,
  activeUser,
  renderLink,
  onLogout,
}) => {
  const hasVisibleMainLinks = mainPages.some((page) => !page.navigation?.isButton);

  const handleLinkClick = (): void => onClose();

  const handleLogout = (): void => {
    onClose();
    onLogout?.();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      variant="drawer"
      drawerPosition="right"
      size="md"
      showCloseButton={false}
      backdrop={true}
      transition={true}
      panelClassName="hidden"
      overridePanelClassName="relative flex flex-col justify-between h-full w-72 bg-surface2 text-surface2-contrast shadow-xl overflow-hidden border-l border-surface-contrast"
    >
      <Box className='h-full flex flex-col justify-between'>
        <Box>
          <Box flex justify="between" align="center" className="h-[56px] shrink-0">
            <span className="text-base font-semibold text-primary">{getGreeting()}</span>
            <Button
              icon="x"
              color="primary"
              variant="ghost"
              size="md"
              rounded={false}
              onClick={onClose}
            />
          </Box>

          <Box flex direction="col" className="flex-1 overflow-y-auto">
            {mainPages
              .filter((page) => !page.navigation?.isButton)
              .map((page) => (
                <div key={page.key} onClick={handleLinkClick}>
                  {renderLink(
                    page,
                    'block px-3 py-2 rounded-md text-sm font-medium text-surface2-contrast hover:text-accent transition-colors duration-150',
                  )}
                </div>
              ))}

            {activeUser && profilePages.length > 0 && (
              <>
                {hasVisibleMainLinks && <Box className="my-2 border-t border-surface3" />}
                {profilePages.map((page) => {
                  if (page.navigation?.isButton) {
                    return (
                      <div key={page.key} onClick={handleLinkClick} className="mt-1">
                        <Button
                          color="primary"
                          variant="solid"
                          size="sm"
                          rounded
                          fullWidth
                        >
                          {renderLink(page)}
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div key={page.key} onClick={handleLinkClick}>
                      {renderLink(
                        page,
                        'block px-3 py-2 rounded-md text-sm font-medium text-surface2-contrast hover:text-accent transition-colors duration-150',
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </Box>
        </Box>
        <Box className="shrink-0">
          {!activeUser &&
            mainPages
              .filter((page) => page.navigation?.isButton)
              .map((page) => (
                <div key={page.key} onClick={handleLinkClick}>
                  <Button
                    color="primary"
                    variant="solid"
                    size="sm"
                    rounded
                    fullWidth
                    className="mt-auto"
                  >
                    {renderLink(page)}
                  </Button>
                </div>
              ))}

          {activeUser && (
            <Button
              color="danger"
              variant="solid"
              size="sm"
              rounded
              fullWidth
              className="mt-auto"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default NavbarSlideout;