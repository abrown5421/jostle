import type { ReactNode } from 'react';
import { Box, Pill, Text } from '../components';
import { mergeClassNames } from '../theme/mergeClassNames';
import { resolveColorClass } from '../theme/resolveColorClass';
import type { ColorSpec } from '../contracts/color.contract';

export interface LeaderboardRow {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  // Competition rank (ties share one) - rows render in the order given, so pass them sorted.
  readonly rank: number;
  // Points just gained, shown as "+N" when positive.
  readonly delta?: number;
  // An avatar or other marker before the name.
  readonly leading?: ReactNode;
  // Anything a game wants just before the score (e.g. Point of Hue's guess swatch).
  readonly trailing?: ReactNode;
  // Emphasises one row - e.g. "you" on a player's own screen.
  readonly highlight?: boolean;
}

export interface LeaderboardProps {
  readonly rows: readonly LeaderboardRow[];
  readonly title?: string;
  readonly textColor?: ColorSpec;
  readonly rowColor?: ColorSpec;
  readonly highlightColor?: ColorSpec;
  readonly className?: string;
}

const DEFAULT_TEXT: ColorSpec = { color: 'surface', intensity: 950 };
const DEFAULT_ROW: ColorSpec = { color: 'surface', intensity: 100 };
const DEFAULT_HIGHLIGHT: ColorSpec = { color: 'primary', intensity: 200 };

// A ranked list of names and scores, for any game. Knows nothing about players or sessions - the
// caller maps its own standings into rows.
export const Leaderboard = ({
  rows,
  title,
  textColor = DEFAULT_TEXT,
  rowColor = DEFAULT_ROW,
  highlightColor = DEFAULT_HIGHLIGHT,
  className,
}: LeaderboardProps) => (
  <Box flex={{ direction: 'col', gap: 8 }} className={mergeClassNames('w-full', className)}>
    {title && (
      <Text as="h2" className="text-lg font-bold" textColor={textColor}>
        {title}
      </Text>
    )}
    <ol className="flex flex-col gap-2" aria-label={title ?? 'Leaderboard'}>
      {rows.map((row) => (
        <li
          key={row.id}
          className={mergeClassNames(
            'flex items-center gap-3 rounded-lg px-3 py-2',
            resolveColorClass('bg', row.highlight ? highlightColor : rowColor),
            resolveColorClass('text', textColor),
          )}
        >
          <span className="w-8 text-center text-lg font-bold tabular-nums">{row.rank}</span>
          {row.leading}
          <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
          {row.delta !== undefined && row.delta > 0 && (
            <Pill color={{ color: 'green', intensity: 200 }} className="flex-none tabular-nums text-green-900">
              +{row.delta}
            </Pill>
          )}
          {row.trailing}
          <span className="w-16 text-right text-lg font-bold tabular-nums">{row.score}</span>
        </li>
      ))}
    </ol>
  </Box>
);
