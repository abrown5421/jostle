import type { ReactNode } from 'react';
import { Box, Text } from '../components';
import { mergeClassNames } from '../theme/mergeClassNames';
import { resolveColorClass } from '../theme/resolveColorClass';
import type { ColorSpec } from '../contracts/color.contract';

export interface PodiumEntry {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  // 1, 2 or 3 - ties may share a step.
  readonly rank: number;
  readonly leading?: ReactNode;
}

export interface PodiumProps {
  // The top finishers, best first - anything past third place is ignored.
  readonly entries: readonly PodiumEntry[];
  readonly textColor?: ColorSpec;
  readonly className?: string;
}

const DEFAULT_TEXT: ColorSpec = { color: 'surface', intensity: 950 };
const STEP_COLORS: Record<number, ColorSpec> = {
  1: { color: 'amber', intensity: 400 },
  2: { color: 'slate', intensity: 300 },
  3: { color: 'orange', intensity: 300 },
};
const STEP_HEIGHTS: Record<number, string> = { 1: 'h-40', 2: 'h-28', 3: 'h-20' };
// Classic podium layout: second on the left, winner in the middle, third on the right.
const LAYOUT_ORDER = [1, 0, 2];

// The end-of-game top three, for any game.
export const Podium = ({ entries, textColor = DEFAULT_TEXT, className }: PodiumProps) => {
  const top = entries.slice(0, 3);
  const arranged = LAYOUT_ORDER.map((index) => top[index]).filter((entry): entry is PodiumEntry => Boolean(entry));

  return (
    <Box flex={{ direction: 'row', align: 'end', justify: 'center', gap: 12 }} className={mergeClassNames('w-full', className)}>
      {arranged.map((entry) => {
        const step = Math.min(3, Math.max(1, entry.rank));
        return (
          <Box key={entry.id} flex={{ direction: 'col', align: 'center', gap: 8 }} className="w-28 sm:w-36">
            {entry.leading}
            <Text as="span" className="w-full truncate text-center font-bold" textColor={textColor}>
              {entry.name}
            </Text>
            <Text as="span" className="text-sm tabular-nums" textColor={textColor}>
              {entry.score} pts
            </Text>
            <div
              className={mergeClassNames(
                'flex w-full items-start justify-center rounded-t-lg pt-2 text-3xl font-black text-surface-950',
                STEP_HEIGHTS[step],
                resolveColorClass('bg', STEP_COLORS[step]),
              )}
            >
              {entry.rank}
            </div>
          </Box>
        );
      })}
    </Box>
  );
};
