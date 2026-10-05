import { useEffect, useMemo } from 'react';
import { alert, Box, Button, Loader, Text, useNavigateWithTransition } from '@inithium/ui';
import {
  clearPlayerCredential,
  connectGameSession,
  disconnectGameSession,
  getPlayerCredential,
  sendGameSessionMessage,
  useGameSession,
  useGetGameQuery,
  usePageParams,
} from '@inithium/api-client';
import type { GameSessionClientState } from '@inithium/api-client';
import { GameMedia } from './games/GameMedia';
import { SURFACE_TEXT } from './games/surfaceColors';

const resolveClosedMessage = ({ closeReason, closeDetail }: GameSessionClientState): string => {
  if (closeReason === 'removed') return closeDetail === 'kicked' ? 'The host removed you from the session.' : 'You left the session.';
  if (closeDetail === 'host-disconnected') return 'The host disconnected, so the session ended.';
  if (closeReason === 'session-ended') return 'The host ended the session.';
  return 'That session is no longer available.';
};

// A player's own device, after joining. The seat token comes from this device's storage (written
// by JoinPage), so a refresh or a phone waking a killed tab lands straight back in the session.
// Today this is just the lobby; a game's controller UI renders here once games exist.
export const PlayPage = () => {
  const navigate = useNavigateWithTransition();
  const code = (usePageParams()['code'] ?? '').toUpperCase();
  const credential = useMemo(() => (code ? getPlayerCredential(code) : null), [code]);
  const sessionState = useGameSession();
  const { status, session, closeReason, lastError } = sessionState;
  // The host's pick arrives on the same session snapshot as everything else - shown here so
  // players know what's coming while the host configures it.
  const selectedGameId = session?.selection?.gameId;
  const { data: selectedGame } = useGetGameQuery(selectedGameId ?? '', { skip: !selectedGameId });

  const playerToken = credential?.playerToken;
  useEffect(() => {
    if (!code) return undefined;
    if (!playerToken) {
      navigate(`/join?code=${encodeURIComponent(code)}`);
      return undefined;
    }
    connectGameSession(playerToken);
    return () => disconnectGameSession();
  }, [code, playerToken, navigate]);

  // Any terminal close means this seat is gone for good - forget its token.
  useEffect(() => {
    if (closeReason && code) clearPlayerCredential(code);
  }, [closeReason, code]);

  useEffect(() => {
    if (lastError) alert.danger(lastError.message, { position: 'bottom-right' });
  }, [lastError]);

  if (closeReason) {
    return (
      <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1">
        <Text as="p" className="text-center text-lg" textColor={SURFACE_TEXT}>
          {resolveClosedMessage(sessionState)}
        </Text>
        <Button variant={{ kind: 'filled', color: 'secondary' }} onClick={() => navigate('/join')}>
          Join another game
        </Button>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box flex={{ justify: 'center', align: 'center' }} className="flex-1">
        <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} label="Connecting…" />
      </Box>
    );
  }

  return (
    <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      {selectedGame && (
        <Box flex={{ direction: 'col', align: 'center', gap: 8 }} className="w-full max-w-xs text-center">
          <Text as="p" className="text-xs font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            Up next
          </Text>
          <GameMedia game={selectedGame} className="rounded-lg" />
          <Text as="p" className="text-xl font-bold" textColor={SURFACE_TEXT}>
            {selectedGame.title}
          </Text>
          <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
            {selectedGame.tagline}
          </Text>
        </Box>
      )}
      <Text as="p" className="text-center text-lg" textColor={SURFACE_TEXT}>
        {status === 'reconnecting'
          ? 'Reconnecting…'
          : selectedGame
            ? 'Waiting for the host to start the game…'
            : 'Waiting for the host to pick a game…'}
      </Text>
      <Button
        variant={{ kind: 'filled', color: 'red', intensity: 500 }}
        onClick={() => sendGameSessionMessage({ type: 'leave' })}
        disabled={status !== 'open'}
      >
        Leave game
      </Button>
    </Box>
  );
};

export default PlayPage;
