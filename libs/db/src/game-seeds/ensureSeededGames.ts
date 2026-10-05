import { gameSeeds } from './registry';
import { createGame, findGameBySlug, updateGame } from '../index';

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 11000;

// A game whose slug changed in a rebrand: current slug -> the slug a database may still hold it
// under. The stored record is found by its old slug and rewritten (slug included) by the seed, so
// a rename never leaves an orphaned duplicate in the catalogue.
const previousSlugs: Record<string, string> = {
  'wordle-war': 'wordle-with-friends',
};

const findSeededGame = async (slug: string) =>
  (await findGameBySlug(slug)) ?? (previousSlugs[slug] ? await findGameBySlug(previousSlugs[slug]) : null);

// Called once at API startup (apps/api/src/main.ts, alongside ensureSeededPages). Unlike pages,
// games are versioned: a missing game is created, and a stored one whose seedVersion is behind its
// seed's is overwritten with the seed - that's how a changed setting or reworded rule reaches a
// database that already has the game. Same-or-newer records are left alone, so this is a no-op on
// every boot after the first.
export const ensureSeededGames = async (): Promise<void> => {
  for (const seed of gameSeeds) {
    const existing = await findSeededGame(seed.slug);
    if (existing) {
      if (existing.seedVersion >= seed.seedVersion) continue;
      await updateGame(existing.id, seed);
      console.log(`Updated game "${seed.slug}" to seed version ${seed.seedVersion}`);
      continue;
    }

    try {
      await createGame(seed);
      console.log(`Seeded game "${seed.slug}"`);
    } catch (error) {
      // See ensureSeededPages - a rolling deploy racing on the unique slug index is expected.
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }
};
