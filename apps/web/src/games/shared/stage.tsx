import type { ReactNode } from 'react';
import { Avatar, Box, Button, Icon, Leaderboard, Podium, Text, dialog, mergeClassNames } from '@inithium/ui';
import type { LeaderboardRow } from '@inithium/ui';
import type { SessionParticipant } from '@inithium/api-client';
import type { PlayerStanding } from '@inithium/game-session';
import type { WebGameAction } from '../registry';
import { resolveParticipantAvatarProps } from './participants';
import { GHOST_BUTTON_PROPS, SECONDARY_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';

// Building blocks for the host screen of a timed, round-based game (iPod War, Point of Hue, ...),
// matching the server's shared timed-phase actions: pause / resume / skip / end / back-to-lobby.

// A server deadline (ISO) as epoch ms for CountdownBar, or null when not running.
export const deadlineOf = (view: { readonly phaseEndsAt: string | null }): number | null =>
  view.phaseEndsAt ? Date.parse(view.phaseEndsAt) : null;

export const StagePanel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Box
    flex={{ direction: 'col', gap: 16 }}
    padding={{ base: 24 }}
    bgColor={SURFACE_BG}
    borderColor={SURFACE_BORDER}
    className={mergeClassNames('rounded-xl', className)}
  >
    {children}
  </Box>
);

const ParticipantAvatar = ({ participant, size, showStatus }: { participant?: SessionParticipant; size: number; showStatus?: boolean }) => {
  const name = participant?.name ?? 'Former player';
  return (
    <Avatar
      {...resolveParticipantAvatarProps({ name, avatar: participant?.avatar ?? null })}
      size={size}
      status={showStatus ? (participant?.isConnected ? 'online' : 'offline') : undefined}
    />
  );
};

// Standings as Leaderboard/Podium rows. `trailingOf` adds per-player content before the score.
export const toLeaderboardRows = (
  standings: readonly PlayerStanding[],
  people: ReadonlyMap<string, SessionParticipant>,
  avatarSize: number,
  trailingOf?: (participantId: string) => ReactNode,
): LeaderboardRow[] =>
  standings.map((standing) => {
    const participant = people.get(standing.participantId);
    return {
      id: standing.participantId,
      name: participant?.name ?? 'Former player',
      score: standing.total,
      rank: standing.rank,
      delta: standing.delta,
      leading: <ParticipantAvatar participant={participant} size={avatarSize} />,
      trailing: trailingOf?.(standing.participantId),
    };
  });

// Who has locked in this round - names only, never what they answered.
export const LockInGrid = ({
  roster,
  lockedIn,
  people,
}: {
  roster: readonly string[];
  lockedIn: readonly string[];
  people: ReadonlyMap<string, SessionParticipant>;
}) => (
  <Box flex={{ direction: 'col', align: 'center', gap: 12 }} className="w-full">
    <Text as="p" className="text-sm font-medium" textColor={SURFACE_TEXT}>
      {lockedIn.length} of {roster.length} locked in
    </Text>
    <ul className="flex flex-wrap justify-center gap-4">
      {roster.map((participantId) => {
        const participant = people.get(participantId);
        const isIn = lockedIn.includes(participantId);
        return (
          <li key={participantId} className={mergeClassNames('flex w-20 flex-col items-center gap-1 transition-opacity', !isIn && 'opacity-40')}>
            <ParticipantAvatar participant={participant} size={56} showStatus />
            <Text as="span" className="w-full truncate text-center text-sm font-medium" textColor={SURFACE_TEXT}>
              {participant?.name ?? 'Player'}
            </Text>
            {isIn && <Icon as="span" name="CheckCircle" size={18} weight="fill" className="text-green-600" />}
          </li>
        );
      })}
    </ul>
  </Box>
);

export interface StageHeaderProps {
  readonly media: ReactNode;
  readonly title: ReactNode;
  readonly subtitle: ReactNode;
  // Shown before the host controls (e.g. Spotify attribution).
  readonly extra?: ReactNode;
  // Hidden once the game reaches its final results.
  readonly isFinal: boolean;
  readonly paused: boolean;
  readonly isOpen: boolean;
  readonly sendAction: (action: WebGameAction) => boolean;
  // Replaces the plain resume - e.g. iPod War also unlocks audio in the same click.
  readonly onResume?: () => void;
  // What "End game" warns about.
  readonly endDescription: string;
}

// The title row plus the host's Pause/Resume, Skip and End game controls.
export const StageHeader = ({ media, title, subtitle, extra, isFinal, paused, isOpen, sendAction, onResume, endDescription }: StageHeaderProps) => {
  const send = (type: string) => () => sendAction({ type });
  const endGame = async () => {
    const confirmed = await dialog.confirm({
      title: 'End the game?',
      description: endDescription,
      confirmLabel: 'End game',
      cancelLabel: 'Keep playing',
      confirmVariant: { kind: 'filled', color: 'red' },
    });
    if (confirmed) sendAction({ type: 'end' });
  };

  return (
    <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 16, wrap: 'wrap' }}>
      <Box flex={{ direction: 'row', align: 'center', gap: 12 }}>
        {media}
        <Box flex={{ direction: 'col' }}>
          <Text as="h1" className="text-xl font-bold" textColor={SURFACE_TEXT}>
            {title}
          </Text>
          <Text as="span" className="text-sm" textColor={SURFACE_TEXT}>
            {subtitle}
          </Text>
        </Box>
      </Box>
      <Box flex={{ direction: 'row', align: 'center', gap: 8, wrap: 'wrap' }}>
        {extra}
        {!isFinal && (
          <>
            {paused ? (
              <Button
                variant={{ kind: 'filled', color: 'primary' }}
                disabled={!isOpen}
                onClick={onResume ?? send('resume')}
                entryAdornment={<Icon as="span" name="Play" size={16} weight="fill" />}
              >
                Resume
              </Button>
            ) : (
              <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={send('pause')} entryAdornment={<Icon as="span" name="Pause" size={16} weight="fill" />}>
                Pause
              </Button>
            )}
            <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={send('skip')} entryAdornment={<Icon as="span" name="SkipForward" size={16} weight="fill" />}>
              Skip
            </Button>
            <Button {...GHOST_BUTTON_PROPS} disabled={!isOpen} onClick={() => void endGame()}>
              End game
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

// The game's end: podium, full standings, and the way back to the lobby.
export const FinalResults = ({
  standings,
  people,
  isOpen,
  sendAction,
}: {
  standings: readonly PlayerStanding[];
  people: ReadonlyMap<string, SessionParticipant>;
  isOpen: boolean;
  sendAction: (action: WebGameAction) => boolean;
}) => (
  <StagePanel className="flex-1 items-center">
    <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
      Final results
    </Text>
    <Podium entries={toLeaderboardRows(standings.slice(0, 3), people, 64)} />
    <Leaderboard rows={toLeaderboardRows(standings, people, 32).map((row) => ({ ...row, delta: undefined }))} className="max-w-xl" />
    <Button variant={{ kind: 'filled', color: 'primary' }} className="text-lg" disabled={!isOpen} onClick={() => sendAction({ type: 'back-to-lobby' })}>
      Back to the lobby
    </Button>
  </StagePanel>
);

export const AUTO_PAUSED_NOTICE = 'Paused because this screen lost its connection. Press Resume when you’re ready.';
