import { mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { ColorSpec } from '@inithium/ui';
import type { LetterMark } from '@inithium/game-session';

// Wordle's tiles and boards, shared by the host screen (colors only) and phones (with letters).

export const MARK_COLORS: Readonly<Record<LetterMark, ColorSpec>> = {
  correct: { color: 'green', intensity: 600 },
  present: { color: 'amber', intensity: 500 },
  absent: { color: 'slate', intensity: 500 },
};

const MARK_LABELS: Readonly<Record<LetterMark, string>> = { correct: 'right spot', present: 'wrong spot', absent: 'not in the word' };

export type TileSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Readonly<Record<TileSize, string>> = {
  xs: 'h-3 w-3 rounded-sm',
  sm: 'h-6 w-6 rounded text-sm',
  md: 'h-11 w-11 rounded-md text-2xl sm:h-12 sm:w-12',
  lg: 'h-16 w-16 rounded-lg text-4xl',
};

export const Tile = ({ letter, mark, size = 'md' }: { letter?: string; mark?: LetterMark; size?: TileSize }) => (
  <span
    aria-label={mark ? `${letter ? `${letter.toUpperCase()}, ` : ''}${MARK_LABELS[mark]}` : letter?.toUpperCase()}
    className={mergeClassNames(
      'flex flex-none items-center justify-center font-black uppercase',
      SIZE_CLASSES[size],
      mark ? mergeClassNames(resolveColorClass('bg', MARK_COLORS[mark]), 'text-white') : 'border-2 border-surface-400 text-surface-950',
    )}
  >
    {size === 'xs' ? null : letter}
  </span>
);

export interface BoardRow {
  // Omitted on boards shown to anyone but their owner.
  readonly letters?: string;
  readonly marks?: readonly LetterMark[];
}

// A full board: every guess made, then (on the owner's phone) the row being typed, then empty rows
// up to the guess limit.
export const BoardGrid = ({
  rows,
  wordLength,
  maxGuesses,
  size = 'md',
  className,
}: {
  rows: readonly BoardRow[];
  wordLength: number;
  maxGuesses: number;
  size?: TileSize;
  className?: string;
}) => (
  <div className={mergeClassNames('flex flex-col', size === 'xs' ? 'gap-0.5' : 'gap-1.5', className)}>
    {Array.from({ length: maxGuesses }, (_, rowIndex) => {
      const row = rows[rowIndex];
      return (
        <div key={rowIndex} className={mergeClassNames('flex', size === 'xs' ? 'gap-0.5' : 'gap-1.5')}>
          {Array.from({ length: wordLength }, (_, column) => (
            <Tile key={column} letter={row?.letters?.[column]} mark={row?.marks?.[column]} size={size} />
          ))}
        </div>
      );
    })}
  </div>
);

export const WordTiles = ({ word, size = 'lg' }: { word: string; size?: TileSize }) => (
  <div className="flex flex-wrap justify-center gap-2" aria-label={word.toUpperCase()}>
    {Array.from(word, (letter, index) => (
      <Tile key={index} letter={letter} mark="correct" size={size} />
    ))}
  </div>
);
