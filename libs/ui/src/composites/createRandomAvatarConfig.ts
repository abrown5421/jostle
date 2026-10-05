import type { AvatarConfig } from '@inithium/db';
import { AVATAR_SHAPES, DICEBEAR_STYLES } from '../tokens/avatar';
import { TAILWIND_SWATCH_COLORS, THEME_SWATCH_COLORS } from '../tokens/colorPicker';

// 'surface' is left out of the theme swatches - it's the page's own neutral, so an avatar in it
// would blend into the lobby list it sits on.
const RANDOM_BG_COLORS = [...THEME_SWATCH_COLORS.filter((color) => color !== 'surface'), ...TAILWIND_SWATCH_COLORS];
// Light and dark ends only - the mid shades (400/500) have no reliably legible text shade in the
// same family.
const LIGHT_INTENSITIES = [200, 300] as const;
const DARK_INTENSITIES = [600, 700, 800] as const;

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;

const generateRandomSeed = (): string => Math.random().toString(36).slice(2, 10);

// A random but always-legible look: the font is the same color family as the background at the
// opposite end of the scale (yellow-200 on yellow-900, indigo-700 on indigo-100), rather than
// resolveContrastColor's fixed light neutral, which washes out on a light palette shade.
const createRandomStyle = (): AvatarConfig['style'] => {
  const color = pick(RANDOM_BG_COLORS);
  const isLight = Math.random() < 0.5;
  return {
    bgColor: { color, intensity: isLight ? pick(LIGHT_INTENSITIES) : pick(DARK_INTENSITIES) },
    fontColor: { color, intensity: isLight ? 900 : 100 },
    shape: pick(AVATAR_SHAPES),
  };
};

// Powers the guest avatar randomizer on the join page - a coin flip between an initials avatar
// and a DiceBear look, each with randomized colors/shape (and a random style + seed for DiceBear).
// Never sets imageUrl or dicebear.options: guests only ever get procedural avatars.
export const createRandomAvatarConfig = (): AvatarConfig =>
  Math.random() < 0.5
    ? { variant: 'initials', style: createRandomStyle() }
    : { variant: 'dicebear', style: createRandomStyle(), dicebear: { style: pick(DICEBEAR_STYLES), seed: generateRandomSeed() } };
