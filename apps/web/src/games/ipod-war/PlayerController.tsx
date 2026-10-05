import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, CountdownBar, Icon, Input, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { IpodWarField, IpodWarGuesses, IpodWarPrivateView, IpodWarPublicView } from '@inithium/game-session';
import type { PlayerControllerProps } from '../registry';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';

const FIELD_LABELS: Record<IpodWarField, string> = { title: 'Song title', artist: 'Artist', album: 'Album' };
// Mirrors the server's MAX_GUESS_LENGTH (ipodWar.reducer.ts).
const MAX_GUESS_LENGTH = 120;

const ordinal = (n: number): string => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

// What's been typed for a song survives a refresh or the phone sleeping - kept per tab, per song.
const draftKey = (code: string, participantId: string, songNumber: number) => `ipod-war:draft:${code}:${participantId}:${songNumber}`;

const readDraft = (key: string): IpodWarGuesses => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? '{}') as IpodWarGuesses;
  } catch {
    return {};
  }
};

const writeDraft = (key: string, guesses: IpodWarGuesses): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(guesses));
  } catch {
    // Storage full or blocked - the draft just won't survive a refresh.
  }
};

const Screen = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 20 }} padding={{ base: 20 }} className="w-full flex-1 text-center">
    {children}
  </Box>
);

const Card = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', gap: 12 }} padding={{ base: 16 }} bgColor={SURFACE_BG} borderColor={SURFACE_BORDER} className="w-full max-w-md rounded-xl text-left">
    {children}
  </Box>
);

const Standing = ({ me }: { me: IpodWarPrivateView }) => (
  <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
    {me.total} points{me.rank ? ` · ${ordinal(me.rank)} of ${me.playerCount}` : ''}
  </Text>
);

const AnswerForm = ({
  view,
  storageKey,
  disabled,
  onSubmit,
}: {
  view: IpodWarPublicView;
  storageKey: string;
  disabled: boolean;
  onSubmit: (guesses: IpodWarGuesses) => void;
}) => {
  const [guesses, setGuesses] = useState<IpodWarGuesses>(() => readDraft(storageKey));
  useEffect(() => setGuesses(readDraft(storageKey)), [storageKey]);

  const update = (field: IpodWarField, value: string) => {
    const next = { ...guesses, [field]: value };
    setGuesses(next);
    writeDraft(storageKey, next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(guesses);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-4">
      {view.fields.map((field, index) => (
        <Input
          key={field}
          label={FIELD_LABELS[field]}
          value={guesses[field] ?? ''}
          maxLength={MAX_GUESS_LENGTH}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={index === 0}
          disabled={disabled}
          onChange={(event) => update(field, event.target.value)}
        />
      ))}
      <Button type="submit" variant={{ kind: 'filled', color: 'primary' }} className="w-full py-3 text-lg disabled:opacity-50" disabled={disabled}>
        Lock in
      </Button>
      <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
        One shot per song - the sooner you lock in, the more a right answer is worth.
      </Text>
    </form>
  );
};

const ResultRows = ({ view, me }: { view: IpodWarPublicView; me: IpodWarPrivateView }) => (
  <Card>
    {view.fields.map((field) => {
      const result = me.result?.fields[field];
      const answer = field === 'title' ? view.answer?.title : field === 'artist' ? view.answer?.artists.join(', ') : view.answer?.album;
      return (
        <Box key={field} flex={{ direction: 'row', align: 'start', gap: 12 }}>
          <Icon
            as="span"
            name={result?.correct ? 'CheckCircle' : 'XCircle'}
            size={24}
            weight="fill"
            className={`mt-0.5 flex-none ${result?.correct ? 'text-green-600' : 'text-red-600'}`}
          />
          <Box flex={{ direction: 'col' }} className="min-w-0 flex-1">
            <Text as="span" className="text-xs font-bold uppercase tracking-wide" textColor={SURFACE_TEXT}>
              {FIELD_LABELS[field]}
            </Text>
            <Text as="span" className="font-semibold" textColor={SURFACE_TEXT}>
              {result?.answer ?? answer}
            </Text>
            <Text as="span" className="text-sm" textColor={SURFACE_TEXT}>
              {result ? (result.guess ? `You said “${result.guess}”` : 'You left it blank') : 'No answer'}
            </Text>
          </Box>
          <Text as="span" className="flex-none font-bold tabular-nums" textColor={SURFACE_TEXT}>
            +{result?.points ?? 0}
          </Text>
        </Box>
      );
    })}
    {me.result && me.result.points > 0 && (
      <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
        Includes a speed bonus of +{me.result.speedBonus} per correct answer.
      </Text>
    )}
  </Card>
);

// A player's phone while iPod War runs: type and lock in during the clip, then see how it scored.
export const PlayerController = ({ session, publicView, privateView, participantId, status, sendAction }: PlayerControllerProps) => {
  const view = publicView as IpodWarPublicView;
  const me = privateView as IpodWarPrivateView | null;
  const storageKey = draftKey(session.code, participantId, view.songNumber);
  const deadline = view.phaseEndsAt ? Date.parse(view.phaseEndsAt) : null;

  if (!me) {
    return (
      <Screen>
        <Text as="p" textColor={SURFACE_TEXT}>
          Connecting…
        </Text>
      </Screen>
    );
  }

  if (!me.isPlaying) {
    return (
      <Screen>
        <Icon as="span" name="Headphones" size={56} />
        <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
          This game started without you - you’ll be in the next one.
        </Text>
      </Screen>
    );
  }

  switch (view.phase) {
    case 'countdown':
    case 'loading':
      return (
        <Screen>
          <Icon as="span" name="Headphones" size={56} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {view.phase === 'countdown' ? 'Get ready!' : `Song ${view.songNumber}`}
          </Text>
          <Text as="p" textColor={SURFACE_TEXT}>
            {view.paused ? 'The host paused the game.' : 'Listen to the host screen…'}
          </Text>
          <Standing me={me} />
        </Screen>
      );

    case 'playing':
      if (me.guesses) {
        return (
          <Screen>
            <Icon as="span" name="LockSimple" size={56} />
            <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
              Locked in
            </Text>
            <Card>
              {view.fields.map((field) => (
                <Text key={field} as="p" textColor={SURFACE_TEXT}>
                  <span className="font-bold">{FIELD_LABELS[field]}:</span> {me.guesses?.[field] || '—'}
                </Text>
              ))}
            </Card>
            <Text as="p" textColor={SURFACE_TEXT}>
              Waiting for the clip to end…
            </Text>
            <CountdownBar endsAt={deadline} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.playbackMs} now={getGameSessionServerNow} className="max-w-md" />
          </Screen>
        );
      }
      return (
        <Screen>
          <Text as="h1" className="text-2xl font-black" textColor={SURFACE_TEXT}>
            Song {view.songNumber} of {view.songCount}
          </Text>
          <CountdownBar endsAt={deadline} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.playbackMs} now={getGameSessionServerNow} className="max-w-md" />
          {view.paused && (
            <Text as="p" className="font-medium" textColor={SURFACE_TEXT}>
              The host paused the game.
            </Text>
          )}
          <AnswerForm
            view={view}
            storageKey={storageKey}
            disabled={view.paused || status !== 'open'}
            onSubmit={(guesses) => sendAction({ type: 'submit', payload: guesses })}
          />
        </Screen>
      );

    case 'reveal':
      return (
        <Screen>
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {me.result ? `+${me.result.points}` : 'No answer'}
          </Text>
          {view.answer && <ResultRows view={view} me={me} />}
          <Standing me={me} />
        </Screen>
      );

    case 'final':
      return (
        <Screen>
          <Icon as="span" name="Trophy" size={64} weight="fill" className={me.rank === 1 ? 'text-amber-500' : ''} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {me.rank === 1 ? 'You won!' : me.rank ? `You finished ${ordinal(me.rank)}` : 'Game over'}
          </Text>
          <Standing me={me} />
          <Text as="p" textColor={SURFACE_TEXT}>
            Look at the host screen for the final standings.
          </Text>
        </Screen>
      );
  }
};
