import { useEffect, useState, type ReactNode } from 'react';
import { alert, Box, Button, Divider, Icon, Loader, Text } from '@inithium/ui';
import { useGetGameQuery } from '@inithium/api-client';
import type {
  GameCatalogueItem,
  GameSessionConnectionStatus,
  GameSettingValues,
  SessionSnapshot,
} from '@inithium/api-client';
import { GameMedia } from '../games/GameMedia';
import { GameSettingsForm } from '../games/GameSettingsForm';
import { firstHostBlocker } from '../games/requirements';
import { useIntegrationResourceBlocker } from '../games/settingControls/IntegrationResourceSetting';
import { getWebGameModule } from '../../games/registry';
import type { HostSetup, HostSetupArgs } from '../../games/registry';
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
  // The latest error the server sent this host - a refused start clears "Starting…".
  readonly lastError?: unknown;
}

const NO_SETUP: HostSetup = { startBlocker: null };
const useNoSetup = (): HostSetup => NO_SETUP;

// Runs a game's useHostSetup hook. Its own component, keyed by game, so switching games swaps
// the hook out by remounting rather than changing the hooks a mounted component calls.
const HostSetupScope = ({
  useSetup,
  args,
  children,
}: {
  useSetup: (args: HostSetupArgs) => HostSetup;
  args: HostSetupArgs;
  children: (setup: HostSetup) => ReactNode;
}) => <>{children(useSetup(args))}</>;

const defaultsOf = (game: GameCatalogueItem): GameSettingValues =>
  Object.fromEntries(game.settings.map((setting) => [setting.key, setting.default]));

// Why Start is disabled, if it is - the server re-checks all of this, this is just the explanation.
const resolveStartBlocker = (
  game: GameCatalogueItem,
  playerCount: number,
  status: GameSessionConnectionStatus,
  settingBlocker: string | null,
  setup: HostSetup,
): string | null => {
  if (status === 'reconnecting') return 'Reconnecting…';
  if (status !== 'open') return 'Connecting…';
  if (playerCount < game.minPlayers) return `Waiting for players - ${playerCount} of ${game.minPlayers} needed.`;
  if (playerCount > game.maxPlayers) return `${game.title} allows up to ${game.maxPlayers} players - remove ${playerCount - game.maxPlayers}.`;
  if (!game.isPlayable) return `${game.title} isn’t playable yet - gameplay is coming soon.`;
  const hostBlocker = firstHostBlocker(game);
  if (hostBlocker) return hostBlocker.reason;
  return settingBlocker ?? setup.startBlocker;
};

export const SessionSettingsView = ({
  session,
  status,
  onChangeSettings,
  onStart,
  onChooseGame,
  onBack,
  lastError,
}: SessionSettingsViewProps) => {
  const { selection } = session;
  const { data: game, isFetching } = useGetGameQuery(selection?.gameId ?? '', { skip: !selection });
  const playerCount = session.participants.length;
  const settingBlocker = useIntegrationResourceBlocker(game?.settings ?? [], selection?.settings ?? {});

  // From the Start click until the game starts (this page then moves on) or the server refuses.
  const [isStarting, setIsStarting] = useState(false);
  useEffect(() => setIsStarting(false), [lastError]);

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

          <HostSetupScope
            key={game.slug}
            useSetup={getWebGameModule(game.slug)?.useHostSetup ?? useNoSetup}
            args={{ game, settings: selection.settings }}
          >
            {(setup) => {
              const startBlocker = resolveStartBlocker(game, playerCount, status, settingBlocker, setup);
              const start = async () => {
                setIsStarting(true);
                try {
                  // Inside the click, so a game can unlock what needs a user gesture (audio).
                  await setup.beforeStart?.();
                  onStart();
                } catch {
                  setIsStarting(false);
                  alert.danger('Couldn’t get this browser ready - try again.', { position: 'bottom-right' });
                }
              };
              return (
                <Box flex={{ direction: 'col', gap: 8 }}>
                  {setup.panel}
                  <Button
                    variant={{ kind: 'filled', color: 'primary' }}
                    className="w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void start()}
                    disabled={startBlocker !== null || isStarting}
                    entryAdornment={<Icon as="span" name="Play" size={18} weight="fill" />}
                  >
                    {isStarting ? 'Starting…' : 'Start game'}
                  </Button>
                  {startBlocker && (
                    <Text as="p" className="text-center text-sm" textColor={SURFACE_TEXT}>
                      {startBlocker}
                    </Text>
                  )}
                </Box>
              );
            }}
          </HostSetupScope>
        </Box>
      </div>
    </Box>
  );
};
