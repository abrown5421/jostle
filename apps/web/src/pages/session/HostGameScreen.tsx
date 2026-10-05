import { useCallback } from 'react';
import { Box, Button, Text } from '@inithium/ui';
import { sendGameSessionMessage } from '@inithium/api-client';
import type { GameSessionClientState, SessionSnapshot } from '@inithium/api-client';
import { getWebGameModule } from '../../games/registry';
import type { WebGameAction } from '../../games/registry';
import { SURFACE_TEXT } from '../games/surfaceColors';

export interface HostGameScreenProps {
  readonly session: SessionSnapshot;
  readonly live: GameSessionClientState;
}

// The shared screen while a game runs: hands the session and the game's views to that game's own
// HostStage (apps/web/src/games/<id>). Knows no game by name.
export const HostGameScreen = ({ session, live }: HostGameScreenProps) => {
  const sendAction = useCallback((action: WebGameAction) => sendGameSessionMessage({ type: 'game:action', action }), []);
  const game = session.game;
  const module = game ? getWebGameModule(game.gameId) : undefined;

  if (!game || !module) {
    return (
      <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1 text-center">
        <Text as="p" textColor={SURFACE_TEXT}>
          This screen can’t show the game in progress - try refreshing.
        </Text>
        <Button variant={{ kind: 'filled', color: 'red', intensity: 500 }} onClick={() => sendGameSessionMessage({ type: 'host:end' })}>
          End session
        </Button>
      </Box>
    );
  }

  return <module.HostStage session={session} publicView={game.view} hostView={live.hostView} status={live.status} sendAction={sendAction} />;
};
