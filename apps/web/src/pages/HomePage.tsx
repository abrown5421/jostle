import { Box, Button, Text, useNavigateWithTransition } from '@inithium/ui';
import { useAppName } from '@inithium/api-client';
import { useCurrentUser } from '../app/useCurrentUser';

const NAVBAR_HEIGHT = 64;

export const HomePage = () => {
  const navigate = useNavigateWithTransition();
  const handleHost = () => navigate('/host');
  const handleJoin = () => navigate('/join');
  const appName = useAppName();
  const { currentUser } = useCurrentUser();
  const isLoggedIn = Boolean(currentUser);

  return (
    <Box
      flex={{ direction: 'col', justify: 'center', align: 'center' }}
      padding={{ base: 16 }}
      style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
    >
      <Box
        flex={{ direction: 'col', align: 'center', gap: 24 }}
        bgColor={{ color: 'surface', intensity: 200 }}
        borderColor={{ color: 'surface', intensity: 300 }}
        padding={{ base: 32 }}
        className="w-full max-w-md rounded-lg border"
      >
        <Text as="h1" className="text-center text-3xl font-bold" textColor={{ color: 'surface', intensity: 950 }}>
          Welcome to {appName}
        </Text>
        <Box flex={{ direction: 'row', justify: 'center', gap: 12 }} className="w-full">
          <Button
            variant={{ kind: 'filled', color: 'primary' }}
            className="flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleHost}
            disabled={!isLoggedIn}
            title={isLoggedIn ? undefined : 'Log in to host a game'}
          >
            Host
          </Button>
          <Button variant={{ kind: 'filled', color: 'secondary' }} className="flex-1" onClick={handleJoin}>
            Join
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
