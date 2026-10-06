import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Icon, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { LetterMark, WordleWarPrivateView, WordleWarPublicView } from '@inithium/game-session';
import type { PlayerControllerProps, WebGameAction } from '../registry';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { BoardGrid, MARK_COLORS, WordTiles } from './tiles';

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

const ordinal = (n: number): string => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

const Screen = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 16 }} padding={{ base: 12 }} className="w-full flex-1 text-center">
    {children}
  </Box>
);

const Standing = ({ me }: { me: WordleWarPrivateView }) => (
  <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
    {me.total} points{me.rank ? ` · ${ordinal(me.rank)} of ${me.playerCount}` : ''}
  </Text>
);

// What's typed for the row in progress - letters only, capped at the word length, and cleared once
// the server has taken the guess (a rejected word stays put to be fixed).
const useDraft = (wordLength: number, guessCount: number) => {
  const [draft, setDraft] = useState('');
  const counted = useRef(guessCount);
  useEffect(() => {
    if (guessCount !== counted.current) setDraft('');
    counted.current = guessCount;
  }, [guessCount]);
  const type = useCallback((letter: string) => setDraft((current) => (current.length < wordLength ? current + letter : current)), [wordLength]);
  const erase = useCallback(() => setDraft((current) => current.slice(0, -1)), []);
  return { draft, type, erase };
};

const KeyButton = ({ label, mark, wide, onPress, children }: { label: string; mark?: LetterMark; wide?: boolean; onPress: () => void; children: ReactNode }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onPress}
    className={mergeClassNames(
      'flex h-12 items-center justify-center rounded-md text-sm font-bold uppercase active:scale-95',
      wide ? 'flex-[1.5] px-1' : 'flex-1',
      mark ? mergeClassNames(resolveColorClass('bg', MARK_COLORS[mark]), 'text-white') : 'bg-surface-300 text-surface-950',
    )}
  >
    {children}
  </button>
);

const Keyboard = ({ keyboard, onLetter, onEnter, onErase }: {
  keyboard: Readonly<Record<string, LetterMark>>;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onErase: () => void;
}) => (
  <div className="flex w-full max-w-lg flex-col gap-1.5">
    {KEY_ROWS.map((row, rowIndex) => (
      <div key={row} className="flex gap-1">
        {rowIndex === 2 && (
          <KeyButton label="Enter" wide onPress={onEnter}>
            Enter
          </KeyButton>
        )}
        {Array.from(row, (letter) => (
          <KeyButton key={letter} label={letter} mark={keyboard[letter]} onPress={() => onLetter(letter)}>
            {letter}
          </KeyButton>
        ))}
        {rowIndex === 2 && (
          <KeyButton label="Delete letter" wide onPress={onErase}>
            <Icon as="span" name="Backspace" size={20} />
          </KeyButton>
        )}
      </div>
    ))}
  </div>
);

const GuessingBoard = ({ view, me, isOpen, sendAction }: { view: WordleWarPublicView; me: WordleWarPrivateView; isOpen: boolean; sendAction: (action: WebGameAction) => boolean }) => {
  const { draft, type, erase } = useDraft(view.wordLength, me.guesses.length);
  const canType = isOpen && me.status === 'playing';
  const submit = useCallback(() => {
    if (canType && draft.length === view.wordLength) sendAction({ type: 'guess', payload: { word: draft } });
  }, [canType, draft, view.wordLength, sendAction]);

  // A physical keyboard works too.
  useEffect(() => {
    if (!canType) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Enter') submit();
      else if (event.key === 'Backspace') erase();
      else if (/^[a-zA-Z]$/.test(event.key)) type(event.key.toLowerCase());
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canType, submit, erase, type]);

  const rows = [...me.guesses.map(({ word, marks }) => ({ letters: word, marks })), ...(canType ? [{ letters: draft }] : [])];
  const finished = view.roster.filter((participantId) => view.progress[participantId]?.status !== 'playing').length;

  return (
    <Screen>
      <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
        Round {view.roundNumber} of {view.roundCount} · {me.guesses.length}/{view.maxGuesses} guesses
      </Text>
      <BoardGrid rows={rows} wordLength={view.wordLength} maxGuesses={view.maxGuesses} size={view.wordLength > 7 ? 'sm' : 'md'} />
      {me.status === 'playing' ? (
        <Keyboard keyboard={me.keyboard} onLetter={type} onEnter={submit} onErase={erase} />
      ) : (
        <Box flex={{ direction: 'col', gap: 4 }} padding={{ base: 16 }} bgColor={SURFACE_BG} borderColor={SURFACE_BORDER} className="w-full max-w-md rounded-xl">
          <Text as="p" className="text-2xl font-black" textColor={SURFACE_TEXT}>
            {me.status === 'solved'
              ? `Solved in ${me.guesses.length} - you’re ${ordinal(me.place ?? 0)}!`
              : 'Out of guesses'}
          </Text>
          <Text as="p" textColor={SURFACE_TEXT}>
            Waiting for the others… ({finished} of {view.roster.length} finished)
          </Text>
        </Box>
      )}
    </Screen>
  );
};

// A player's phone while Wordle War runs: their own board and keyboard - nobody else's.
export const PlayerController = ({ publicView, privateView, status, sendAction }: PlayerControllerProps) => {
  const view = publicView as WordleWarPublicView;
  const me = privateView as WordleWarPrivateView | null;
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

  if (!me.isPlaying) {
    return (
      <Screen>
        <Icon as="span" name="GridFour" size={56} />
        <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
          This game started without you - you’ll be in the next one.
        </Text>
      </Screen>
    );
  }

  switch (view.phase) {
    case 'countdown':
      return (
        <Screen>
          <Icon as="span" name="GridFour" size={64} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            Get ready!
          </Text>
          <Text as="p" textColor={SURFACE_TEXT}>
            {view.wordLength} letters, {view.maxGuesses} guesses. Everyone’s racing on the same word.
          </Text>
        </Screen>
      );

    case 'guessing':
      return <GuessingBoard view={view} me={me} isOpen={isOpen} sendAction={sendAction} />;

    case 'reveal':
      return (
        <Screen>
          <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            The word was
          </Text>
          {view.secret && <WordTiles word={view.secret} size={view.wordLength > 7 ? 'md' : 'lg'} />}
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {me.lastResult ? `+${me.lastResult.points}` : 'No points this round'}
          </Text>
          {me.lastResult && (
            <Text as="p" textColor={SURFACE_TEXT}>
              {ordinal(me.lastResult.place)} to solve: {me.lastResult.placementPoints} + {me.lastResult.guessBonus} for unused guesses
            </Text>
          )}
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
