import { useState } from 'react';
import type { ColorSpec } from '../contracts/color.contract';

// The theme's brand families - surface is left out since a surface border is the plain default
// look these colors exist to break up.
const WHIMSICAL_COLORS = ['primary', 'secondary', 'tertiary', 'quaternary', 'accent'] as const;

const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// One color per field for forms that want a playful mix of field colors (login, signup, ...)
// instead of a hardcoded color per field. Drawn as consecutive shuffles of the theme palette, so
// the first five fields are always all distinct and no two neighbouring fields ever match, even
// past five. Picked once on mount - the colors stay put while the user types, and change on the
// next visit.
export const useWhimsicalFieldColors = (count: number, intensity: ColorSpec['intensity'] = 500): ColorSpec[] => {
  const [colors] = useState(() => {
    const picked: string[] = [];
    while (picked.length < count) {
      let round = shuffle(WHIMSICAL_COLORS);
      if (round[0] === picked[picked.length - 1]) {
        round = [...round.slice(1), round[0]];
      }
      picked.push(...round);
    }
    return picked.slice(0, count).map((color) => ({ color, intensity }));
  });
  return colors;
};
