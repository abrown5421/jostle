import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Loader, Text, useNavigateWithTransition } from '@inithium/ui';
import { sendGameSessionMessage, useGetGameQuery, usePageParams } from '@inithium/api-client';
import { SessionSettingsView } from './session/SessionSettingsView';
import { useHostSession } from './session/useHostSession';
import { useParticipantSounds } from './session/useParticipantSounds';
import { SECONDARY_BUTTON_PROPS, SURFACE_TEXT } from './games/surfaceColors';
import { firstHostBlocker, resolveRequirementPath } from './games/requirements';

const CenteredMessage = ({ title, body, onHost, onHome }: { title: string; body: string; onHost: () => void; onHome: () => void }) => (
  <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1 text-center">
    <Text as="h1" className="text-2xl font-bold" textColor={SURFACE_TEXT}>
      {title}
    </Text>
    <Text as="p" textColor={SURFACE_TEXT}>
      {body}
    </Text>
    <Box flex={{ direction: 'row', gap: 12 }}>
      <Button variant={{ kind: 'filled', color: 'primary' }} onClick={onHost}>
        Host a session
      </Button>
      <Button {...SECONDARY_BUTTON_PROPS} onClick={onHome}>
        Home
      </Button>
    </Box>
  </Box>
);

// /settings/:code - the host configures the session's selected game, then starts it. Reached from
// the lobby (game picked before hosting) or from picking a game on /games (game picked after).
// Only the signed-in user's own live session can be configured here; any other code - someone
// else's, or one that has ended - gets a way back to hosting instead.
export const SessionSettingsPage = () => {
  const navigate = useNavigateWithTransition();
  const location = useLocation();
  const code = (usePageParams()['code'] ?? '').toUpperCase();
  const { userId, isResolvingUser, isLoading, hosted, session, live, isReady } = useHostSession();

  useEffect(() => {
    if (!isResolvingUser && !userId) navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  }, [isResolvingUser, userId, navigate, location.pathname]);

  // No game picked yet (e.g. a bookmarked link) - the next step is picking one, not configuring.
  const isOwnSession = Boolean(hosted && session && session.code === code && !live.closeReason);
  const hasSelection = Boolean(session?.selection);
  useEffect(() => {
    if (isOwnSession && !hasSelection) navigate('/games');
  }, [isOwnSession, hasSelection, navigate]);

  // Once the game is running, the host screen is where it plays.
  const isInGame = isOwnSession && session?.status === 'in-game';
  useEffect(() => {
    if (isInGame) navigate('/host');
  }, [isInGame, navigate]);

  // A game this host can't host yet (e.g. Spotify not connected) - send them to fix that first,
  // coming back here afterwards.
  const { data: selectedGame } = useGetGameQuery(session?.selection?.gameId ?? '', { skip: !isOwnSession || !hasSelection });
  const blocked = Boolean(isOwnSession && firstHostBlocker(selectedGame));
  useEffect(() => {
    if (blocked && userId) navigate(resolveRequirementPath(userId, location.pathname));
  }, [blocked, userId, navigate, location.pathname]);

  useParticipantSounds(isOwnSession ? session?.participants : undefined);

  if (isLoading || !userId) {
    return (
      <Box flex={{ justify: 'center', align: 'center' }} className="flex-1">
        <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} label="Loading session…" />
      </Box>
    );
  }

  if (live.closeReason && hosted?.session.code === code) {
    return (
      <CenteredMessage
        title="Session ended"
        body="This session is no longer running."
        onHost={() => navigate('/host')}
        onHome={() => navigate('/')}
      />
    );
  }

  if (!isOwnSession || !session) {
    return (
      <CenteredMessage
        title="Session not found"
        body={`You’re not hosting a session with the code ${code || '—'}.`}
        onHost={() => navigate('/host')}
        onHome={() => navigate('/')}
      />
    );
  }

  return (
    <SessionSettingsView
      session={session}
      // 'open' only once the server has welcomed this host - controls stay disabled until then.
      status={isReady ? 'open' : live.status === 'reconnecting' ? 'reconnecting' : 'connecting'}
      onChangeSettings={(settings) => sendGameSessionMessage({ type: 'host:update-game-settings', settings })}
      onStart={() => sendGameSessionMessage({ type: 'host:start-game' })}
      onChooseGame={() => navigate('/games')}
      onBack={() => navigate('/host')}
      lastError={live.lastError}
    />
  );
};

export default SessionSettingsPage;
