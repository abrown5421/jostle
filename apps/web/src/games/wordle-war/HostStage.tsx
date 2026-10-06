import { Alert, Avatar, Box, CountdownBar, Icon, Leaderboard, Pill, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { SessionParticipant } from '@inithium/api-client';
import type { WordleWarProgress, WordleWarPublicView } from '@inithium/game-session';
import type { HostStageProps } from '../registry';
import { participantsById, resolveParticipantAvatarProps } from '../shared/participants';
import { AUTO_PAUSED_NOTICE, deadlineOf, FinalResults, StageHeader, StagePanel, toLeaderboardRows } from '../shared/stage';
import { useSoundOnIncrease } from '../shared/useSoundOnIncrease';
import { SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { BoardGrid, WordTiles } from './tiles';

// Mirrors the server's COUNTDOWN_MS (wordleWar.reducer.ts) - runtime values can't be imported from
// @inithium/game-session in the browser, only its types.
const COUNTDOWN_MS = 5_000;

const ordinal = (n: number): string => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

const StatusPill = ({ progress }: { progress: WordleWarProgress }) => {
  switch (progress.status) {
    case 'solved':
      return <Pill color={{ color: 'green', intensity: 200 }}>Solved · {ordinal(progress.place ?? 0)}</Pill>;
    case 'out':
      return <Pill color={{ color: 'surface', intensity: 300 }}>Out</Pill>;
    default:
      return null;
  }
};

// One player's race, as the room sees it: the colors of every guess, never the letters.
const ProgressCard = ({ participant, name, progress, maxGuesses, wordLength }: {
  participant?: SessionParticipant;
  name: string;
  progress: WordleWarProgress;
  maxGuesses: number;
  wordLength: number;
}) => (
  <li>
    <Box flex={{ direction: 'col', align: 'center', gap: 8 }} padding={{ base: 12 }} className="h-full rounded-xl bg-surface-200/60">
      <Box flex={{ direction: 'row', align: 'center', gap: 8 }} className="w-full min-w-0">
        <Avatar {...resolveParticipantAvatarProps({ name, avatar: participant?.avatar ?? null })} size={28} status={participant?.isConnected ? 'online' : 'offline'} />
        <Text as="span" className="min-w-0 flex-1 truncate font-semibold" textColor={SURFACE_TEXT}>
          {name}
        </Text>
        <Text as="span" className="text-sm tabular-nums" textColor={SURFACE_TEXT}>
          {progress.guessCount}/{maxGuesses}
        </Text>
      </Box>
      <BoardGrid rows={progress.rows.map((marks) => ({ marks }))} wordLength={wordLength} maxGuesses={maxGuesses} size={wordLength > 7 ? 'xs' : 'sm'} />
      <StatusPill progress={progress} />
    </Box>
  </li>
);

// The shared screen while Wordle War runs: everyone's race in colors only, then the word and the
// leaderboard.
export const HostStage = ({ session, publicView, status, sendAction }: HostStageProps) => {
  const view = publicView as WordleWarPublicView;
  const people = participantsById(session.participants);
  const isOpen = status === 'open';
  const progressOf = (participantId: string) => view.progress[participantId];
  const guessesThisRound = view.roster.reduce((sum, participantId) => sum + (progressOf(participantId)?.guessCount ?? 0), 0);
  const finished = view.roster.filter((participantId) => progressOf(participantId)?.status !== 'playing').length;
  useSoundOnIncrease(guessesThisRound, `round-${view.roundNumber}`);

  const timer = (totalMs: number, className: string) => (
    <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={totalMs} now={getGameSessionServerNow} className={className} />
  );

  const roundSummary = (participantId: string) => {
    const score = view.roundScores?.[participantId];
    return (
      <Text as="span" className="w-28 text-right text-xs" textColor={SURFACE_TEXT}>
        {score ? `${ordinal(score.place)} in ${score.guessesUsed}` : 'Didn’t solve'}
      </Text>
    );
  };

  return (
    <Box flex={{ direction: 'col', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <StageHeader
        media={<Icon as="span" name="GridFour" size={40} />}
        title="Wordle War"
        subtitle={
          <>
            {view.phase === 'final' ? `${view.roundCount} rounds` : `Round ${view.roundNumber} of ${view.roundCount}`} · {view.wordLength} letters ·
            Room code <span className="font-mono font-bold tracking-widest">{session.code}</span>
          </>
        }
        isFinal={view.phase === 'final'}
        paused={view.paused}
        isOpen={isOpen}
        sendAction={sendAction}
        showPause={view.phase === 'countdown' || view.phase === 'reveal'}
        skipLabel={view.phase === 'guessing' ? 'End round' : 'Skip'}
        endDescription="Everyone goes straight to the final results. The round in progress won’t be scored."
      />

      {view.paused && view.autoPaused && <Alert severity="warning" closeable={false} duration={0} message={AUTO_PAUSED_NOTICE} />}

      {view.phase === 'countdown' && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            Get ready
          </Text>
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            {view.roundCount} {view.roundCount === 1 ? 'word' : 'words'}, {view.wordLength} letters, {view.maxGuesses} guesses each
          </Text>
          {timer(COUNTDOWN_MS, 'max-w-xl')}
        </StagePanel>
      )}

      {view.phase === 'guessing' && (
        <StagePanel className="flex-1">
          <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 12, wrap: 'wrap' }}>
            <Text as="h2" className="text-3xl font-black" textColor={SURFACE_TEXT}>
              Crack the word!
            </Text>
            <Text as="p" className="font-medium" textColor={SURFACE_TEXT}>
              {finished} of {view.roster.length} finished
            </Text>
          </Box>
          <ul className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))' }}>
            {view.roster.map((participantId) => {
              const progress = progressOf(participantId);
              if (!progress) return null;
              return (
                <ProgressCard
                  key={participantId}
                  participant={people.get(participantId)}
                  name={people.get(participantId)?.name ?? 'Former player'}
                  progress={progress}
                  maxGuesses={view.maxGuesses}
                  wordLength={view.wordLength}
                />
              );
            })}
          </ul>
        </StagePanel>
      )}

      {view.phase === 'reveal' && view.secret && (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StagePanel className="items-center justify-center text-center">
            <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
              The word was
            </Text>
            <WordTiles word={view.secret} />
            {timer(view.revealMs, 'max-w-md')}
            <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
              {view.roundNumber < view.roundCount ? 'Next word coming up' : 'Final results coming up'}
            </Text>
          </StagePanel>
          <StagePanel>
            <Leaderboard title="Leaderboard" rows={toLeaderboardRows(view.standings, people, 32, roundSummary)} />
          </StagePanel>
        </div>
      )}

      {view.phase === 'final' && <FinalResults standings={view.standings} people={people} isOpen={isOpen} sendAction={sendAction} />}
    </Box>
  );
};
