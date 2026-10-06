import { invalidAction, isRecord } from '../shared';
import type { FishbowlClue } from './fishbowl.types';

export const MAX_CLUE_LENGTH = 60;

// What makes two clues "the same": case and spacing don't count.
export const normalizeClueKey = (text: string): string => text.trim().replace(/\s+/g, ' ').toLowerCase();

export const readClueText = (payload: unknown): string => {
  const raw = isRecord(payload) ? payload['text'] : undefined;
  if (typeof raw !== 'string') throw invalidAction('Send your clue as text');
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) throw invalidAction('Write a clue first');
  if (text.length > MAX_CLUE_LENGTH) throw invalidAction(`Clues can be at most ${MAX_CLUE_LENGTH} characters`);
  return text;
};

export const isDuplicateClue = (clues: Readonly<Record<string, FishbowlClue>>, text: string): boolean => {
  const key = normalizeClueKey(text);
  return Object.values(clues).some((clue) => normalizeClueKey(clue.text) === key);
};

export const cluesBy = (clues: Readonly<Record<string, FishbowlClue>>, authorId: string): FishbowlClue[] =>
  Object.values(clues).filter((clue) => clue.authorId === authorId);

export const shuffle = <T>(items: readonly T[], random: () => number): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
