import { navigationService } from '@inithium/router';
import { selectActiveUser } from '@inithium/store';
import { Box, Button } from '@inithium/ui';
import React from 'react';
import { useSelector } from 'react-redux';

const createGameCode = (length: number): string =>
  Array.from({ length }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 36)
    )
  ).join('');

const handleHostGame = (generateCode: () => string) => 
  (navigate: (path: string) => void) => 
  (): void => {
    const code = generateCode();
    navigate(`/host?code=${code}`);
  };

const handleNavigation = (navigate: (path: string) => void) => 
  (path: string) => 
  (): void => {
    navigate(path);
  };

const Home: React.FC = () => {
  const activeUser = useSelector(selectActiveUser);
  const isAuthenticated = Boolean(activeUser?._id);

  const safeNavigate = (path: string) => {
    navigationService.navigate(path);
  };

  const navigateTo = handleNavigation(safeNavigate);

  const onHostClick = handleHostGame(() => createGameCode(6))(safeNavigate);
  const onJoinClick = navigateTo('/join');

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className='w-4/5 md:w-1/3 lg:w-1/5 gap-4'>
      <div className={isAuthenticated ? 'w-full' : 'group relative w-full cursor-not-allowed'}>
        <Button 
          color='primary' 
          fullWidth 
          disabled={!isAuthenticated} 
          className={isAuthenticated ? '' : 'pointer-events-none'}
          onClick={onHostClick}
        >
          Host Game
        </Button>
        
        {!isAuthenticated && (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            You must be logged in to host a game
          </span>
        )}
      </div>

      <Button onClick={onJoinClick} color='secondary' fullWidth>Join Game</Button>
    </Box>
  );
};

export default Home;