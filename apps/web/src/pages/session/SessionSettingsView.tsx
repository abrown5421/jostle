import { Box, Button, Divider, Icon, Loader, Text } from '@inithium/ui';
import { useGetGameQuery } from '@inithium/api-client';
import type {
  GameCatalogueItem,
  GameSessionConnectionStatus,
  GameSettingValues,
  SessionSnapshot,
} from '@inithium/api-client';
import { GameMedia } from '../games/GameMedia';
import { GameSettingsForm } from '../games/GameSettingsForm';
import { formatPlayerCount } from '../games/gameLabels';
import {
  GHOST_BUTTON_PROPS,
  SECONDARY_BUTTON_PROPS,
  SURFACE_BG,
  SURFACE_BORDER,
  SURFACE_TEXT,
} from '../games/surfaceColors';
import { SessionHeaderBar } from './SessionHeaderBar';

export interface SessionSettingsViewProps {
  readonly session: SessionSnapshot;
  readonly status: GameSessionConnectionStatus;
  readonly onChangeSettings: (patch: GameSettingValues) => void;
  readonly onStart: () => void;
  readonly onChooseGame: () => void;
  readonly onBack: () => void;
}

const defaultsOf = (game: GameCatalogueItem): GameSettingValues =>
  Object.fromEntries(game.settings.map((setting) => [setting.key, setting.default]));

// Why Start is disabled, if it is - the server re-checks all of this, this is just the explanation.
const resolveStartBlocker = (game: GameCatalogueItem, playerCount: number, status: GameSessionConnectionStatus): string | null => {
  if (status === 'reconnecting') return 'Reconnecting…';
  if (status !== 'open') return 'Connecting…';
  if (playerCount < game.minPlayers) return `Waiting for players - ${playerCount} of ${game.minPlayers} needed.`;
  if (playerCount > game.maxPlayers) return `${game.title} allows up to ${game.maxPlayers} players - remove ${playerCount - game.maxPlayers}.`;
  if (!game.isPlayable) return `${game.title} isn’t playable yet - gameplay is coming soon.`;
  return null;
};

export const SessionSettingsView = ({ session, status, onChangeSettings, onStart, onChooseGame, onBack }: SessionSettingsViewProps) => {
  const { selection } = session;
  const { data: game, isFetching } = useGetGameQuery(selection?.gameId ?? '', { skip: !selection });
  const playerCount = session.participants.length;

  const header = <SessionHeaderBar code={session.code} playerCount={playerCount} onBack={onBack} />;

  if (!selection || (!game && !isFetching)) {
    return (
      <Box flex={{ direction: 'col' }} className="w-full flex-1">
        {header}
        <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 32 }} className="flex-1">
          <Text as="p" textColor={SURFACE_TEXT}>
            {selection ? 'That game is no longer available.' : 'No game picked yet.'}
          </Text>
          <Button variant={{ kind: 'filled', color: 'primary' }} onClick={onChooseGame}>
            Choose a game
          </Button>
        </Box>
      </Box>
    );
  }

  if (!game) {
    return (
      <Box flex={{ direction: 'col' }} className="w-full flex-1">
        {header}
        <Box flex={{ justify: 'center', align: 'center' }} className="flex-1">
          <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} label="Loading game…" />
        </Box>
      </Box>
    );
  }

  const defaults = defaultsOf(game);
  const isDefault = game.settings.every((setting) => selection.settings[setting.key] === defaults[setting.key]);
  const startBlocker = resolveStartBlocker(game, playerCount, status);

  return (
    <Box flex={{ direction: 'col' }} className="w-full flex-1">
      {header}
      <div className="grid w-full flex-1 grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:p-10">
        <Box flex={{ direction: 'col', gap: 16 }}>
          <GameMedia game={game} className="rounded-lg" />
          <Text as="h1" className="text-3xl font-bold" textColor={SURFACE_TEXT}>
            {game.title}
          </Text>
          <Text as="p" textColor={SURFACE_TEXT}>
            {game.tagline}
          </Text>
          <Text as="p" className="inline-flex items-center gap-1 text-sm font-medium" textColor={SURFACE_TEXT}>
            <Icon as="span" name="Users" size={16} />
            {formatPlayerCount(game)} · {playerCount} joined
          </Text>
          <Box>
            <Button {...SECONDARY_BUTTON_PROPS} onClick={onChooseGame}>
              Change game
            </Button>
          </Box>
        </Box>

        <Box
          flex={{ direction: 'col', gap: 24 }}
          padding={{ base: 24 }}
          bgColor={SURFACE_BG}
          borderColor={SURFACE_BORDER}
          className="h-fit rounded-lg"
        >
          <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 12 }}>
            <Text as="h2" className="text-xl font-bold" textColor={SURFACE_TEXT}>
              Settings
            </Text>
            {game.settings.length > 0 && (
              <Button
                {...GHOST_BUTTON_PROPS}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onChangeSettings(defaults)}
                disabled={isDefault || status !== 'open'}
                entryAdornment={<Icon as="span" name="ArrowCounterClockwise" size={16} />}
              >
                Reset to defaults
              </Button>
            )}
          </Box>

          {game.settings.length > 0 ? (
            <GameSettingsForm
              definitions={game.settings}
              values={selection.settings}
              onChange={onChangeSettings}
              disabled={status !== 'open'}
            />
          ) : (
            <Text as="p" textColor={SURFACE_TEXT}>
              This game has nothing to configure.
            </Text>
          )}

          <Divider color={SURFACE_BORDER} />

          <Box flex={{ direction: 'col', gap: 8 }}>
            <Button
              variant={{ kind: 'filled', color: 'primary' }}
              className="w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onStart}
              disabled={startBlocker !== null}
              entryAdornment={<Icon as="span" name="Play" size={18} weight="fill" />}
            >
              Start game
            </Button>
            {startBlocker && (
              <Text as="p" className="text-center text-sm" textColor={SURFACE_TEXT}>
                {startBlocker}
              </Text>
            )}
          </Box>
        </Box>
      </div>
    </Box>
  );
};
