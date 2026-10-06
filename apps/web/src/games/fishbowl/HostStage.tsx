import { Alert, Box, Button, CountdownBar, Icon, Select, SelectItem, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { SessionParticipant } from '@inithium/api-client';
import type { FishbowlPublicView } from '@inithium/game-session';
import type { HostStageProps, WebGameAction } from '../registry';
import { participantsById } from '../shared/participants';
import { useSoundOnIncrease } from '../shared/useSoundOnIncrease';
import { AUTO_PAUSED_NOTICE, deadlineOf, StageHeader, StagePanel } from '../shared/stage';
import { SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { ROUND_RULES } from './roundRules';
import { nameOf, RoundBanner, TeamBadge, teamById, TeamResults, TeamScoreboard, TurnRecap } from './teamDisplays';

type People = ReadonlyMap<string, SessionParticipant>;

const pauseNotice = (view: FishbowlPublicView, people: People): string | null => {
  if (!view.paused) return null;
  switch (view.pauseCause) {
    case 'presenter-disconnected':
      return `Paused - ${nameOf(people, view.presenterId)}'s phone disconnected. The turn picks up when they're back, or press Resume.`;
    case 'host-disconnected':
      return AUTO_PAUSED_NOTICE;
    default:
      return null;
  }
};

// Teams side by side with everyone's clue progress, and the host's way to rebalance them.
const SetupBoard = ({
  view,
  people,
  isOpen,
  sendAction,
}: {
  view: FishbowlPublicView;
  people: People;
  isOpen: boolean;
  sendAction: (action: WebGameAction) => boolean;
}) => {
  const everyone = view.teams.flatMap((team) => team.members);
  const waitingOn = everyone.filter((participantId) => (view.submitted[participantId] ?? 0) < view.cluesPerPlayer);
  return (
    <StagePanel className="flex-1">
      <Box flex={{ direction: 'col', align: 'center', gap: 4 }} className="text-center">
        <Text as="h2" className="text-3xl font-black" textColor={SURFACE_TEXT}>
          Fill the bowl!
        </Text>
        <Text as="p" textColor={SURFACE_TEXT}>
          Everyone adds {view.cluesPerPlayer} {view.cluesPerPlayer === 1 ? 'clue' : 'clues'} on their phone - {view.totalClues} in so far.
        </Text>
      </Box>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(view.teams.length, 3)}, minmax(0, 1fr))` }}>
        {view.teams.map((team) => (
          <Box
            key={team.id}
            flex={{ direction: 'col', gap: 8 }}
            padding={{ base: 12 }}
            className={mergeClassNames('rounded-xl border-t-8', resolveColorClass('border', { color: team.color, intensity: 500 }))}
          >
            <TeamBadge team={team} className="text-xl" />
            <ul className="flex flex-col gap-2">
              {team.members.map((memberId) => {
                const done = (view.submitted[memberId] ?? 0) >= view.cluesPerPlayer;
                return (
                  <li key={memberId} className="flex flex-col gap-1">
                    <span className={mergeClassNames('flex items-center justify-between gap-2', resolveColorClass('text', SURFACE_TEXT))}>
                      <span className="truncate font-medium">{nameOf(people, memberId)}</span>
                      <span className="flex items-center gap-1 text-sm tabular-nums">
                        {view.submitted[memberId] ?? 0}/{view.cluesPerPlayer}
                        {done && <Icon as="span" name="CheckCircle" size={16} weight="fill" className="text-green-600" />}
                      </span>
                    </span>
                    <Select
                      value={team.id}
                      disabled={!isOpen || team.members.length === 1}
                      onValueChange={(teamId) => sendAction({ type: 'move-player', payload: { participantId: memberId, teamId } })}
                    >
                      {view.teams.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.id === team.id ? `On ${option.name}` : `Move to ${option.name}`}
                        </SelectItem>
                      ))}
                    </Select>
                  </li>
                );
              })}
            </ul>
          </Box>
        ))}
      </div>
      <Box flex={{ direction: 'col', align: 'center', gap: 8 }}>
        <Button
          variant={{ kind: 'filled', color: 'primary' }}
          className="px-8 text-lg disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isOpen || waitingOn.length > 0}
          onClick={() => sendAction({ type: 'begin' })}
          entryAdornment={<Icon as="span" name="Play" size={18} weight="fill" />}
        >
          Start round 1
        </Button>
        {waitingOn.length > 0 && (
          <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
            Waiting on {waitingOn.map((participantId) => nameOf(people, participantId)).join(', ')}
          </Text>
        )}
      </Box>
    </StagePanel>
  );
};

// The shared screen while Fishbowl runs. Never shows a clue still in play - only what a finished
// turn guessed.
export const HostStage = ({ session, publicView, status, sendAction }: HostStageProps) => {
  const view = publicView as FishbowlPublicView;
  const people = participantsById(session.participants);
  const isOpen = status === 'open';
  // Banked points plus the turn in progress only ever rise on a Correct - including the one that
  // empties the bowl and ends the turn - and fall on an Undo.
  useSoundOnIncrease(view.teams.reduce((sum, team) => sum + team.total, 0) + view.turnPoints, 'fishbowl');
  const activeTeam = teamById(view, view.activeTeamId);
  const presenterName = nameOf(people, view.presenterId);
  const notice = pauseNotice(view, people);
  const rule = ROUND_RULES[view.round];

  const subtitle = view.phase === 'setup' ? 'Filling the bowl' : view.phase === 'final' ? 'Final results' : `Round ${view.round} of 3 · ${rule.title}`;

  return (
    <Box flex={{ direction: 'col', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <StageHeader
        media={<Icon as="span" name="Fish" size={40} />}
        title="Fishbowl"
        subtitle={
          <>
            {subtitle} · Room code <span className="font-mono font-bold tracking-widest">{session.code}</span>
          </>
        }
        isFinal={view.phase === 'final'}
        paused={view.paused}
        isOpen={isOpen}
        sendAction={sendAction}
        showPause={view.phase === 'turn'}
        showSkip={view.phase === 'ready' || view.phase === 'turn'}
        skipLabel={view.phase === 'turn' ? 'End turn' : 'Skip presenter'}
        endDescription="Everyone goes straight to the final results. The turn in progress won’t be scored."
      />

      {notice && <Alert severity="warning" closeable={false} duration={0} message={notice} />}

      {view.phase === 'setup' && <SetupBoard view={view} people={people} isOpen={isOpen} sendAction={sendAction} />}

      {(view.phase === 'ready' || view.phase === 'turn') && (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StagePanel className="items-center justify-center text-center">
            {view.phase === 'ready' ? (
              <>
                {view.lastTurn && <TurnRecap recap={view.lastTurn} view={view} people={people} />}
                {view.roundJustStarted && <RoundBanner round={view.round} />}
                <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
                  Up next
                </Text>
                <Text as="h2" className="text-5xl font-black" textColor={SURFACE_TEXT}>
                  {presenterName}
                </Text>
                {activeTeam && <TeamBadge team={activeTeam} className="text-2xl" />}
                <Text as="p" textColor={SURFACE_TEXT}>
                  Waiting for {presenterName} to tap Start turn…
                </Text>
              </>
            ) : (
              <>
                {activeTeam && <TeamBadge team={activeTeam} className="text-2xl" />}
                <Text as="h2" className="text-5xl font-black" textColor={SURFACE_TEXT}>
                  {presenterName} is presenting
                </Text>
                <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
                  {rule.title}: {rule.rule}
                </Text>
                <CountdownBar
                  endsAt={deadlineOf(view)}
                  pausedRemainingMs={view.pausedRemainingMs}
                  totalMs={view.turnMs}
                  now={getGameSessionServerNow}
                  className="max-w-2xl"
                />
                <Text as="p" className="text-6xl font-black tabular-nums" textColor={SURFACE_TEXT}>
                  +{view.turnPoints}
                </Text>
              </>
            )}
            <Text as="p" className="inline-flex items-center gap-2 font-medium" textColor={SURFACE_TEXT}>
              <Icon as="span" name="Fish" size={20} />
              {view.bowlCount} of {view.totalClues} clues left in the bowl
            </Text>
          </StagePanel>
          <StagePanel>
            <TeamScoreboard view={view} people={people} />
          </StagePanel>
        </div>
      )}

      {view.phase === 'final' && (
        <StagePanel className="flex-1 items-center">
          <TeamResults
            view={view}
            footer={
              <Button
                variant={{ kind: 'filled', color: 'primary' }}
                className="text-lg"
                disabled={!isOpen}
                onClick={() => sendAction({ type: 'back-to-lobby' })}
              >
                Back to the lobby
              </Button>
            }
          />
        </StagePanel>
      )}
    </Box>
  );
};
