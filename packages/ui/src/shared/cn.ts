import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge internal component classes with a consumer-supplied `className`.
 * Uses tailwind-merge (not plain concatenation) because two conflicting
 * Tailwind utilities — e.g. this component's `bg-primary` and a consumer's
 * `bg-red-500` — don't resolve by source order, they resolve by whichever
 * rule Tailwind happened to emit later in the stylesheet. tailwind-merge
 * drops the earlier one by Tailwind "slot" so the LAST argument always
 * wins, which is what lets a blowoff `className` take precedence.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
