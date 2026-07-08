import { selectActiveUser } from '@inithium/store';
import { Box, Button } from '@inithium/ui';
import React from 'react';
import { useSelector } from 'react-redux';

const Home: React.FC = () => {
  const activeUser = useSelector(selectActiveUser);

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className='w-4/5 md:w-1/3 lg:w-1/5 gap-4'>
      <div className={!activeUser ? 'group relative w-full cursor-not-allowed' : 'w-full'}>
        <Button color='primary' fullWidth disabled={!activeUser} className="pointer-events-none">
          Host Game
        </Button>
        
        {!activeUser && (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            You must be logged in to host a game
          </span>
        )}
      </div>

      <Button color='secondary' fullWidth>Join Game</Button>
    </Box>
  );
};

export default Home;