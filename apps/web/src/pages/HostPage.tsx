import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Box, Button, Loader, Text, useNavigateWithTransition } from '@inithium/ui';
import { getGameSessionError, sendGameSessionMessage, useGetGameQuery } from '@inithium/api-client';
import { HostGameScreen } from './session/HostGameScreen';
import { HostLobbyStep } from './session/HostLobbyStep';
import { firstHostBlocker, resolveRequirementPath } from './games/requirements';
import { useHostSession } from './session/useHostSession';
import { useParticipantSounds } from './session/useParticipantSounds';
import { SECONDARY_BUTTON_PROPS, SURFACE_TEXT } from './games/surfaceColors';

// The shared screen (TV/laptop) for a session's lobby. The host is never a participant - this
// screen only displays the session; to also play, the host joins from a second device like anyone
// else.
//
// One step of the host flow, which spans three pages sharing one retained socket (see
// useHostSession):
// - Hosted straight away: /host (players join) -> /games (pick) -> /settings/:code -> start.
// - Picked a game first: /games -> /host?game=<slug> (players join, game already picked) ->
//   /settings/:code -> start.
export const HostPage = () => {
  const navigate = useNavigateWithTransition();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId, isResolvingUser, session, live, isReady, createError, retryCreate } = useHostSession({ create: true });
  const { status, closeReason, closeDetail } = live;
  const requestedGameId = searchParams.get('game');

  useEffect(() => {
    // Keeps ?game= through the login round-trip, so a pick made on /games survives it.
    if (!isResolvingUser && !userId) navigate(`/login?redirect=${encodeURIComponent(`/host${location.search}`)}`);
  }, [isResolvingUser, userId, navigate, location.search]);

  // A game picked on /games before there was a session: select it once the server is listening,
  // then drop the param so a refresh doesn't re-send it. A game this host can't host yet (e.g.
  // Spotify not connected) sends them to fix that first, then back here with the pick intact.
  const { data: requestedGame, isFetching: isFetchingRequestedGame } = useGetGameQuery(requestedGameId ?? '', {
    skip: !requestedGameId || !userId,
  });
  useEffect(() => {
    if (!isReady || !requestedGameId || isFetchingRequestedGame || !userId) return;
    if (firstHostBlocker(requestedGame)) {
      navigate(resolveRequirementPath(userId, `/host?game=${encodeURIComponent(requestedGameId)}`));
      return;
    }
    sendGameSessionMessage({ type: 'host:select-game', gameId: requestedGameId });
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('game');
        return next;
      },
      { replace: true },
    );
  }, [isReady, requestedGameId, requestedGame, isFetchingRequestedGame, userId, navigate, setSearchParams]);

  useParticipantSounds(session?.participants);

  if (createError) {
    return (
      <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1">
        <Text as="p" textColor={SURFACE_TEXT}>
          {getGameSessionError(createError).message}
        </Text>
        <Button variant={{ kind: 'filled', color: 'primary' }} onClick={retryCreate}>
          Try again
        </Button>
      </Box>
    );
  }

  if (closeReason) {
    return (
      <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1">
        <Text as="h1" className="text-2xl font-bold" textColor={SURFACE_TEXT}>
          Session ended
        </Text>
        <Text as="p" textColor={SURFACE_TEXT}>
          {closeDetail === 'host-ended'
            ? 'You ended this session.'
            : closeDetail === 'host-disconnected'
              ? 'The host screen was disconnected for too long.'
              : 'This session is no longer available.'}
        </Text>
        <Box flex={{ direction: 'row', gap: 12 }}>
          <Button variant={{ kind: 'filled', color: 'primary' }} onClick={retryCreate}>
            Host a new session
          </Button>
          <Button {...SECONDARY_BUTTON_PROPS} onClick={() => navigate('/')}>
            Home
          </Button>
        </Box>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box flex={{ justify: 'center', align: 'center' }} className="flex-1">
        <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} label="Starting session…" />
      </Box>
    );
  }

  if (session.status === 'in-game' && session.game) return <HostGameScreen session={session} live={live} />;

  return (
    <HostLobbyStep
      session={session}
      status={status}
      onChooseGame={() => navigate('/games')}
      onConfigure={() => navigate(`/settings/${session.code}`)}
      onKick={(participantId) => sendGameSessionMessage({ type: 'host:kick', participantId })}
      onEnd={() => sendGameSessionMessage({ type: 'host:end' })}
    />
  );
};

export default HostPage;
