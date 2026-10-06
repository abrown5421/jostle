import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, CountdownBar, Icon, IconButton, Input, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { FishbowlPrivateView, FishbowlPublicView } from '@inithium/game-session';
import type { PlayerControllerProps, WebGameAction } from '../registry';
import { participantsById } from '../shared/participants';
import { deadlineOf } from '../shared/stage';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { ROUND_RULES } from './roundRules';
import { nameOf, RoundBanner, TeamBadge, teamById, TeamResults, TeamScoreboard, TurnRecap } from './teamDisplays';

// Mirrors the server's MAX_CLUE_LENGTH (fishbowl/clues.ts).
const MAX_CLUE_LENGTH = 60;

type Send = (action: WebGameAction) => boolean;

const Screen = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 20 }} padding={{ base: 20 }} className="w-full flex-1 text-center">
    {children}
  </Box>
);

const Card = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', gap: 12 }} padding={{ base: 16 }} bgColor={SURFACE_BG} borderColor={SURFACE_BORDER} className="w-full max-w-md rounded-xl">
    {children}
  </Box>
);

const TurnTimer = ({ view }: { view: FishbowlPublicView }) => (
  <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.turnMs} now={getGameSessionServerNow} className="max-w-md" />
);

const ClueEntry = ({ view, me, isOpen, sendAction }: { view: FishbowlPublicView; me: FishbowlPrivateView; isOpen: boolean; sendAction: Send }) => {
  const [draft, setDraft] = useState('');
  // A clue that made it into the bowl clears the field; a rejected one (duplicate, ...) stays to fix.
  const added = useRef(me.myClues.length);
  useEffect(() => {
    if (me.myClues.length > added.current) setDraft('');
    added.current = me.myClues.length;
  }, [me.myClues.length]);

  const isFull = me.myClues.length >= me.cluesRequired;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) sendAction({ type: 'submit-clue', payload: { text: draft } });
  };
  const everyone = view.teams.flatMap((team) => team.members);
  const ready = everyone.filter((participantId) => (view.submitted[participantId] ?? 0) >= view.cluesPerPlayer).length;

  return (
    <Card>
      <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
        Your clues ({me.myClues.length}/{me.cluesRequired})
      </Text>
      {!isFull && (
        <form onSubmit={submit} className="flex items-end gap-2">
          <Input
            label="A person, place, thing or phrase"
            value={draft}
            maxLength={MAX_CLUE_LENGTH}
            autoComplete="off"
            disabled={!isOpen}
            onChange={(event) => setDraft(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant={{ kind: 'filled', color: 'primary' }} disabled={!isOpen || !draft.trim()}>
            Add
          </Button>
        </form>
      )}
      <ul className="flex flex-col gap-2 text-left">
        {me.myClues.map((clue) => (
          <li key={clue.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-200 px-3 py-2">
            <span className="truncate">{clue.text}</span>
            <IconButton
              icon="X"
              label={`Remove ${clue.text}`}
              disabled={!isOpen}
              onClick={() => sendAction({ type: 'remove-clue', payload: { clueId: clue.id } })}
            />
          </li>
        ))}
      </ul>
      {isFull && (
        <Text as="p" textColor={SURFACE_TEXT}>
          All in! Waiting for everyone else ({ready} of {everyone.length} done).
        </Text>
      )}
    </Card>
  );
};

const PresenterControls = ({ view, me, isOpen, sendAction }: { view: FishbowlPublicView; me: FishbowlPrivateView; isOpen: boolean; sendAction: Send }) => {
  const send = (type: string) => () => sendAction({ type });
  const canAct = isOpen && !view.paused;
  return (
    <Screen>
      <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
        {ROUND_RULES[view.round].title} · +{view.turnPoints} this turn
      </Text>
      <TurnTimer view={view} />
      <Box flex={{ justify: 'center', align: 'center' }} padding={{ base: 24 }} bgColor={SURFACE_BG} borderColor={SURFACE_BORDER} className="min-h-40 w-full max-w-md rounded-2xl">
        <Text as="p" className="break-words text-4xl font-black" textColor={SURFACE_TEXT}>
          {view.paused ? 'Paused' : me.currentClue}
        </Text>
      </Box>
      <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
        {ROUND_RULES[view.round].rule}
      </Text>
      <Box flex={{ direction: 'col', gap: 12 }} className="w-full max-w-md">
        <Button
          variant={{ kind: 'filled', color: 'green', intensity: 600 }}
          className="w-full py-4 text-xl disabled:opacity-50"
          disabled={!canAct}
          onClick={send('correct')}
          entryAdornment={<Icon as="span" name="Check" size={24} weight="bold" />}
        >
          Correct
        </Button>
        <Box flex={{ direction: 'row', gap: 12 }}>
          {view.allowSkipping && (
            <Button variant={{ kind: 'outlined', color: 'surface', intensity: 950 }} className="flex-1 py-3 disabled:opacity-50" disabled={!canAct} onClick={send('skip-clue')}>
              Skip
            </Button>
          )}
          <Button
            variant={{ kind: 'ghost', color: 'surface', intensity: 950 }}
            className="flex-1 py-3 disabled:opacity-50"
            disabled={!canAct || !me.canUndo}
            onClick={send('undo')}
            entryAdornment={<Icon as="span" name="ArrowCounterClockwise" size={18} />}
          >
            Undo last
          </Button>
        </Box>
      </Box>
      <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
        {view.bowlCount} {view.bowlCount === 1 ? 'clue' : 'clues'} left in the bowl
      </Text>
    </Screen>
  );
};

// A player's phone while Fishbowl runs: add clues, then present (seeing the clue), guess, or watch
// - depending on whose turn it is.
export const PlayerController = ({ session, publicView, privateView, status, sendAction }: PlayerControllerProps) => {
  const view = publicView as FishbowlPublicView;
  const me = privateView as FishbowlPrivateView | null;
  const people = participantsById(session.participants);
  const isOpen = status === 'open';

  if (!me) {
    return (
      <Screen>
        <Text as="p" textColor={SURFACE_TEXT}>
          Connecting…
        </Text>
      </Screen>
    );
  }

  const myTeam = teamById(view, me.teamId);
  const activeTeam = teamById(view, view.activeTeamId);
  const presenterName = nameOf(people, view.presenterId);

  if (!myTeam) {
    return (
      <Screen>
        <Icon as="span" name="Fish" size={56} />
        <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
          This game started without you - you’ll be in the next one.
        </Text>
      </Screen>
    );
  }

  switch (view.phase) {
    case 'setup':
      return (
        <Screen>
          <Text as="h1" className="text-2xl font-black" textColor={SURFACE_TEXT}>
            You’re on <TeamBadge team={myTeam} className="inline-flex" />
          </Text>
          <ClueEntry view={view} me={me} isOpen={isOpen} sendAction={sendAction} />
          <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
            Keep them secret - everyone plays the whole bowl.
          </Text>
        </Screen>
      );

    case 'ready':
      return (
        <Screen>
          {view.lastTurn && <TurnRecap recap={view.lastTurn} view={view} people={people} />}
          {me.isPresenter ? (
            <>
              <RoundBanner round={view.round} />
              <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
                You’re up!
              </Text>
              <Button
                variant={{ kind: 'filled', color: 'primary' }}
                className="w-full max-w-md py-4 text-xl disabled:opacity-50"
                disabled={!isOpen}
                onClick={() => sendAction({ type: 'start-turn' })}
                entryAdornment={<Icon as="span" name="Play" size={24} weight="fill" />}
              >
                Start turn
              </Button>
            </>
          ) : (
            <>
              {view.roundJustStarted && <RoundBanner round={view.round} />}
              <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
                Up next
              </Text>
              <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
                {presenterName}
              </Text>
              {activeTeam && <TeamBadge team={activeTeam} className="text-lg" />}
              <Text as="p" textColor={SURFACE_TEXT}>
                {activeTeam?.id === myTeam.id ? 'Get ready to guess!' : 'Your team is up after them.'}
              </Text>
            </>
          )}
          <TeamScoreboard view={view} people={people} highlightTeamId={myTeam.id} showMembers={false} />
        </Screen>
      );

    case 'turn':
      if (me.isPresenter) return <PresenterControls view={view} me={me} isOpen={isOpen} sendAction={sendAction} />;
      return (
        <Screen>
          <Icon as="span" name={activeTeam?.id === myTeam.id ? 'Lightbulb' : 'Eye'} size={56} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {activeTeam?.id === myTeam.id ? 'Guess!' : `${activeTeam?.name ?? 'The other team'} is up`}
          </Text>
          <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
            {presenterName} is presenting · {ROUND_RULES[view.round].title}
          </Text>
          <TurnTimer view={view} />
          {view.paused && (
            <Text as="p" className="font-medium" textColor={SURFACE_TEXT}>
              The turn is paused.
            </Text>
          )}
          <Text as="p" className="text-5xl font-black tabular-nums" textColor={SURFACE_TEXT}>
            +{view.turnPoints}
          </Text>
          <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
            {view.bowlCount} {view.bowlCount === 1 ? 'clue' : 'clues'} left in the bowl
          </Text>
        </Screen>
      );

    case 'final':
      return (
        <Screen>
          <TeamResults view={view} highlightTeamId={myTeam.id} />
          <Text as="p" textColor={SURFACE_TEXT}>
            {myTeam.rank === 1 ? 'Your team won!' : `Your team finished #${myTeam.rank}.`}
          </Text>
        </Screen>
      );
  }
};
