import { navigationService } from '@inithium/router';
import { selectActiveUser, useCreateSessionMutation } from '@inithium/store';
import { Box, Button } from '@inithium/ui';
import React from 'react';
import { useSelector } from 'react-redux';

const Home: React.FC = () => {
  const activeUser = useSelector(selectActiveUser);
  const isAuthenticated = Boolean(activeUser?._id);
  const [createSession, { isLoading }] = useCreateSessionMutation();

  const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 

  const generateJoinCode = (length = 6): string => {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
    }
    return code;
  };

  const handleHost = async () => {
    if (!activeUser?._id) return;

    const joinCode = generateJoinCode();

    const session = await createSession({
      join_code: joinCode,
      host_id: activeUser._id,
      status: 'lobby',
      players: [
        {
          player_id: activeUser._id,
          user_id: activeUser._id,
          display_name: `${activeUser.first_name} ${activeUser.last_name}`.trim(),
          score: 0,
          connected: true,
          is_host: true,
        },
      ],
    }).unwrap();

    navigationService.navigate(`/host/${session._id}`);
  };


  const handleJoin = () => {
    navigationService.navigate(`/join`);
  };

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className='w-4/5 md:w-1/3 lg:w-1/5 gap-4'>
      <div className={isAuthenticated ? 'w-full' : 'group relative w-full cursor-not-allowed'}>
        <Button
          color='primary'
          fullWidth
          disabled={!isAuthenticated || isLoading}
          className={isAuthenticated ? '' : 'pointer-events-none'}
          onClick={handleHost}
        >
          {isLoading ? 'Creating...' : 'Host Game'}
        </Button>

        {!isAuthenticated && (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            You must be logged in to host a game
          </span>
        )}
      </div>

      <Button color='secondary' fullWidth onClick={handleJoin}>Join Game</Button>
    </Box>
  );
};

export default Home;