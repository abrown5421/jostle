import { useEffect, useState } from 'react';
import { Box, Button, Icon, Text, useNavigateWithTransition } from '@inithium/ui';
import { sendGameSessionMessage } from '@inithium/api-client';
import type { GameCatalogueItem } from '@inithium/api-client';
import { GameCatalogue } from './games/GameCatalogue';
import type { GameCardAction } from './games/GameCard';
import { SECONDARY_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from './games/surfaceColors';
import { describeBlockerAction, firstHostBlocker, resolveRequirementPath } from './games/requirements';
import { useHostSession } from './session/useHostSession';

// The game catalogue, and the game-picking step of both host flows:
// - No session yet (browsing first): Host -> /host?game=<slug>, which opens a lobby with that game
//   already picked; once players are in, the lobby moves on to /settings/:code.
// - Session already running (hosted first, then came here from the lobby): Select picks the game
//   for that session and moves straight on to /settings/:code.
export const GamesPage = () => {
  const navigate = useNavigateWithTransition();
  const { userId, isLoading, hosted, session, live, isReady } = useHostSession();

  // A session that ended while this page was open no longer counts - fall back to hosting anew.
  const activeSession = hosted && !live.closeReason ? session : null;
  const selectedGameId = activeSession?.selection?.gameId ?? null;

  // Moves on only once the server has confirmed the pick, so a rejected one stays on this page.
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  useEffect(() => {
    if (pendingGameId && activeSession && selectedGameId === pendingGameId) {
      setPendingGameId(null);
      navigate(`/settings/${activeSession.code}`);
    }
  }, [pendingGameId, activeSession, selectedGameId, navigate]);
  useEffect(() => {
    if (live.lastError) setPendingGameId(null);
  }, [live.lastError]);

  // Mid-game there's nothing to pick - the game is on the host screen.
  const isInGame = activeSession?.status === 'in-game';
  useEffect(() => {
    if (isInGame) navigate('/host');
  }, [isInGame, navigate]);

  const resolveAction = (game: GameCatalogueItem): GameCardAction => {
    const hostPath = `/host?game=${encodeURIComponent(game.slug)}`;
    if (!userId) {
      return {
        label: 'Host',
        hint: 'Hosting needs an account - players can join as guests.',
        onClick: () => navigate(`/login?redirect=${encodeURIComponent(hostPath)}`),
      };
    }
    if (isLoading) return { label: 'Host', disabled: true, onClick: () => undefined };
    // Something the host must set up first (e.g. Spotify Premium) - send them to fix it, then
    // straight back to picking this game.
    const blocker = firstHostBlocker(game);
    if (blocker) {
      return {
        label: describeBlockerAction(blocker),
        hint: blocker.reason,
        onClick: () => navigate(resolveRequirementPath(userId, activeSession ? '/games' : hostPath)),
      };
    }
    if (!activeSession) return { label: 'Host', onClick: () => navigate(hostPath) };

    const isCurrent = game.slug === selectedGameId;
    return {
      label: pendingGameId === game.slug ? 'Selecting…' : isCurrent ? 'Configure' : 'Select',
      disabled: !isReady || pendingGameId !== null,
      onClick: () => {
        if (isCurrent) {
          navigate(`/settings/${activeSession.code}`);
          return;
        }
        setPendingGameId(game.slug);
        sendGameSessionMessage({ type: 'host:select-game', gameId: game.slug });
      },
    };
  };

  return (
    <Box flex={{ direction: 'col', align: 'center', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <Box flex={{ direction: 'col', align: 'center', gap: 8 }} className="text-center">
        <Text as="h1" className="text-3xl font-bold" textColor={SURFACE_TEXT}>
          {activeSession ? 'Choose a game' : 'Games'}
        </Text>
      </Box>

      {activeSession && (
        <Box
          flex={{ direction: 'row', justify: 'between', align: 'center', gap: 12, wrap: 'wrap' }}
          padding={{ base: 12 }}
          bgColor={SURFACE_BG}
          borderColor={SURFACE_BORDER}
          className="w-full max-w-3xl rounded-lg"
        >
          <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
            Choosing for session <span className="font-mono font-bold tracking-widest">{activeSession.code}</span>
          </Text>
          <Text as="p" className="inline-flex items-center gap-1 text-sm font-medium" textColor={SURFACE_TEXT}>
            <Icon as="span" name="Users" size={16} />
            {activeSession.participants.length} {activeSession.participants.length === 1 ? 'player' : 'players'}
          </Text>
          <Button {...SECONDARY_BUTTON_PROPS} onClick={() => navigate('/host')}>
            Back to lobby
          </Button>
        </Box>
      )}

      <GameCatalogue resolveAction={resolveAction} selectedGameId={selectedGameId} />
    </Box>
  );
};

export default GamesPage;
