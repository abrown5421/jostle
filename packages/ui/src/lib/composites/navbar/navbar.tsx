import React, { useState, useEffect } from 'react';
import { Box, Button } from '../../components';
import NavSlot from './nav-slot';
import LogoSlot from './logo-slot';
import UserSlot from './user-slot';
import NavbarSlideout from './navbar-slideout';
import { NavbarProps } from './navbar.types';

export const Navbar: React.FC<NavbarProps> = ({
  pages,
  profilePages,
  activeUser,
  renderLink,
  onLogout,
}) => {
  const [slideoutOpen, setSlideoutOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
    mq.addEventListener('change', handler);
    setIsLargeScreen(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const openSlideout = () => setSlideoutOpen(true);
  const closeSlideout = () => setSlideoutOpen(false);

  const showMainLinksInSlideout = !isLargeScreen;

  return (
    <>
      <Box flex justify="between" align="center" color="surface2" className="h-[56px]">
        <LogoSlot />

        <Box flex direction="row" align="center">
          <Box className="hidden lg:flex">
            <NavSlot pages={pages} renderLink={renderLink} />
          </Box>

          <Box className="flex lg:hidden">
            {activeUser ? (
              <Box padding="sm" className="h-[56px]" flex align="center">
                <UserSlot activeUser={activeUser} onAvatarClick={openSlideout} />
              </Box>
            ) : (
              <Button
                icon="menu"
                color="primary"
                variant="ghost"
                size="md"
                rounded={false}
                onClick={openSlideout}
              />
            )}
          </Box>

          <Box className="hidden lg:flex">
            {activeUser && (
              <UserSlot activeUser={activeUser} onAvatarClick={openSlideout} />
            )}
          </Box>
        </Box>
      </Box>

      <NavbarSlideout
        mainPages={showMainLinksInSlideout ? pages : []}
        profilePages={profilePages}
        isOpen={slideoutOpen}
        onClose={closeSlideout}
        activeUser={activeUser}
        renderLink={renderLink}
        onLogout={onLogout}
      />
    </>
  );
};