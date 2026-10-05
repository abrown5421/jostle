import { Alert, Box, CountdownBar, Icon, Leaderboard, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { PointOfHueHostView, PointOfHuePublicView } from '@inithium/game-session';
import type { HostStageProps } from '../registry';
import { participantsById } from '../shared/participants';
import { AUTO_PAUSED_NOTICE, deadlineOf, FinalResults, LockInGrid, StageHeader, StagePanel, toLeaderboardRows } from '../shared/stage';
import { SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { ColorSwatch } from './ColorSwatch';

// Mirrors the server's COUNTDOWN_MS (pointOfHue.reducer.ts) - runtime values can't be imported
// from @inithium/game-session in the browser, only its types.
const COUNTDOWN_MS = 5_000;

const percent = (accuracy: number): string => `${Math.round(accuracy * 100)}%`;

// The shared screen while Point of Hue runs: the color to memorize (this screen alone ever has it
// before the reveal), who's locked in, then every guess against the original and the leaderboard.
export const HostStage = ({ session, publicView, hostView, status, sendAction }: HostStageProps) => {
  const view = publicView as PointOfHuePublicView;
  const host = (hostView as PointOfHueHostView | null) ?? null;
  const people = participantsById(session.participants);
  const isOpen = status === 'open';
  const timer = (totalMs: number, className: string) => (
    <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={totalMs} now={getGameSessionServerNow} className={className} />
  );

  // The guess each player made, next to their score on the reveal's leaderboard.
  const guessChip = (participantId: string) => {
    const guess = view.guesses?.[participantId];
    if (!guess) {
      return (
        <Text as="span" className="w-20 text-right text-xs" textColor={SURFACE_TEXT}>
          No guess
        </Text>
      );
    }
    return (
      <span className="flex w-20 flex-none items-center justify-end gap-2">
        <ColorSwatch hex={guess.hex} className="h-7 w-7 rounded-md" label={`Guess ${guess.hex}`} />
        <span className="text-sm font-semibold tabular-nums">{percent(guess.accuracy)}</span>
      </span>
    );
  };

  return (
    <Box flex={{ direction: 'col', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <StageHeader
        media={<Icon as="span" name="Palette" size={40} />}
        title="Point of Hue"
        subtitle={
          <>
            {view.phase === 'final' ? `${view.roundCount} rounds` : `Round ${view.roundNumber} of ${view.roundCount}`} · Room code{' '}
            <span className="font-mono font-bold tracking-widest">{session.code}</span>
          </>
        }
        isFinal={view.phase === 'final'}
        paused={view.paused}
        isOpen={isOpen}
        sendAction={sendAction}
        endDescription="Everyone goes straight to the final results. The round in progress won’t be scored."
      />

      {view.paused && view.autoPaused && <Alert severity="warning" closeable={false} duration={0} message={AUTO_PAUSED_NOTICE} />}

      {view.phase === 'countdown' && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            Get ready
          </Text>
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            {view.roundCount} colors to remember
          </Text>
          {timer(COUNTDOWN_MS, 'max-w-xl')}
        </StagePanel>
      )}

      {view.phase === 'viewing' && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            Memorize this color!
          </Text>
          {host?.targetHex ? (
            <ColorSwatch hex={host.targetHex} className="aspect-video w-full max-w-3xl rounded-2xl shadow-lg" label="The color to remember" />
          ) : (
            <Text as="p" textColor={SURFACE_TEXT}>
              Loading the color…
            </Text>
          )}
          {timer(view.viewMs, 'max-w-3xl')}
        </StagePanel>
      )}

      {view.phase === 'guessing' && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Box flex={{ justify: 'center', align: 'center' }} className="aspect-video w-full max-w-xl rounded-2xl border-4 border-dashed border-surface-400">
            <Icon as="span" name="Question" size={96} />
          </Box>
          <Text as="h2" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            Recreate it on your phone!
          </Text>
          {timer(view.guessMs, 'max-w-2xl')}
          <LockInGrid roster={view.roster} lockedIn={view.lockedIn} people={people} />
        </StagePanel>
      )}

      {view.phase === 'reveal' && view.target && (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StagePanel className="items-center justify-center text-center">
            <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
              The color was
            </Text>
            <ColorSwatch hex={view.target} className="aspect-video w-full max-w-xl rounded-2xl shadow-lg" label="The original color" />
            <Text as="p" className="font-mono text-2xl font-bold uppercase" textColor={SURFACE_TEXT}>
              {view.target}
            </Text>
            {timer(view.revealMs, 'max-w-md')}
            <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
              {view.roundNumber < view.roundCount ? 'Next color coming up' : 'Final results coming up'}
            </Text>
          </StagePanel>
          <StagePanel>
            <Leaderboard title="Leaderboard" rows={toLeaderboardRows(view.standings, people, 32, guessChip)} />
          </StagePanel>
        </div>
      )}

      {view.phase === 'final' && <FinalResults standings={view.standings} people={people} isOpen={isOpen} sendAction={sendAction} />}
    </Box>
  );
};
