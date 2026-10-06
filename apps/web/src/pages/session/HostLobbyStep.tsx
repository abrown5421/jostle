import { QRCodeSVG } from 'qrcode.react';
import { Box, Button, Loader, Text } from '@inithium/ui';
import { useGetGameQuery } from '@inithium/api-client';
import type { GameSessionConnectionStatus, SessionSnapshot } from '@inithium/api-client';
import { GameMedia } from '../games/GameMedia';
import { formatPlayerCount } from '../games/gameLabels';
import { SECONDARY_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../games/surfaceColors';
import { ParticipantList } from './ParticipantList';

const buildJoinUrl = (code: string): string => `${window.location.origin}/join?code=${encodeURIComponent(code)}`;

interface NextGamePanelProps {
  readonly gameId: string | null;
  readonly onChooseGame: () => void;
  readonly onConfigure: () => void;
}

const NextGamePanel = ({ gameId, onChooseGame, onConfigure }: NextGamePanelProps) => {
  const { data: game, isFetching } = useGetGameQuery(gameId ?? '', { skip: !gameId });

  return (
    <Box
      flex={{ direction: 'col', gap: 12 }}
      padding={{ base: 16 }}
      bgColor={SURFACE_BG}
      borderColor={SURFACE_BORDER}
      className="w-full max-w-sm rounded-lg"
    >
      <Text as="p" className="text-xs font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
        Up next
      </Text>
      {!gameId ? (
        <>
          <Text as="p" textColor={SURFACE_TEXT}>
            No game picked yet.
          </Text>
          <Button variant={{ kind: 'filled', color: 'primary' }} onClick={onChooseGame}>
            Choose a game
          </Button>
        </>
      ) : !game ? (
        isFetching ? (
          <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} />
        ) : (
          <Text as="p" textColor={SURFACE_TEXT}>
            That game is no longer available.
          </Text>
        )
      ) : (
        <>
          <Box flex={{ direction: 'row', align: 'center', gap: 12 }}>
            <GameMedia game={game} iconSize={32} className="w-24 flex-none rounded" />
            <Box flex={{ direction: 'col', gap: 4 }}>
              <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
                {game.title}
              </Text>
              <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
                {formatPlayerCount(game)}
              </Text>
            </Box>
          </Box>
          <Box flex={{ direction: 'row', gap: 8 }}>
            <Button variant={{ kind: 'filled', color: 'primary' }} className="flex-1" onClick={onConfigure}>
              Continue to settings
            </Button>
            <Button {...SECONDARY_BUTTON_PROPS} onClick={onChooseGame}>
              Change
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export interface HostLobbyStepProps {
  readonly session: SessionSnapshot;
  readonly status: GameSessionConnectionStatus;
  readonly isEnding: boolean;
  readonly onChooseGame: () => void;
  readonly onConfigure: () => void;
  readonly onKick: (participantId: string) => void;
  readonly onEnd: () => void;
}

// Waiting for players: join code + QR on one side, who's joined on the other, and what's up next.
export const HostLobbyStep = ({ session, status, isEnding, onChooseGame, onConfigure, onKick, onEnd }: HostLobbyStepProps) => (
  // Two equal full-width columns (stacked on narrow screens), stretched to the page's height.
  <div className="grid w-full flex-1 grid-cols-1 lg:grid-cols-2">
    <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }}>
      <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
        Join code
      </Text>
      <Text as="p" className="font-mono text-6xl font-bold tracking-[0.2em]" textColor={SURFACE_TEXT}>
        {session.code}
      </Text>
      {/* White quiet zone so the code stays scannable in dark mode. */}
      <Box padding={{ base: 12 }} className="rounded-md bg-white">
        <QRCodeSVG value={buildJoinUrl(session.code)} size={220} />
      </Box>
      <Text as="p" className="break-all text-center text-sm" textColor={SURFACE_TEXT}>
        Scan or go to {window.location.host}/join
      </Text>
      {status === 'reconnecting' && (
        <Text as="p" textColor={SURFACE_TEXT}>
          Reconnecting…
        </Text>
      )}
      <NextGamePanel gameId={session.selection?.gameId ?? null} onChooseGame={onChooseGame} onConfigure={onConfigure} />
      {/* Not gated on the socket being open - ending goes over REST, so it works mid-reconnect. */}
      <Button variant={{ kind: 'filled', color: 'red', intensity: 500 }} onClick={onEnd} disabled={isEnding}>
        End session
      </Button>
    </Box>

    <Box bgColor={{ color: 'surface', intensity: 200 }} padding={{ base: 32 }}>
      <ParticipantList participants={session.participants} onRemove={onKick} />
    </Box>
  </div>
);
