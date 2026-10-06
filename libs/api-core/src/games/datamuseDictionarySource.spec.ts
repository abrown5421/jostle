import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDatamuseCache, datamuseDictionarySource, datamuseQueryUrl } from './datamuseDictionarySource';

const signal = new AbortController().signal;

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

describe('Datamuse dictionary source', () => {
  beforeEach(() => {
    clearDatamuseCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds one spelling-pattern query per first letter, scaled to the word length', () => {
    expect(datamuseQueryUrl('a', 5)).toBe('https://api.datamuse.com/words?sp=a%3F%3F%3F%3F&md=fp&max=1000');
    expect(new URL(datamuseQueryUrl('q', 7)).searchParams.get('sp')).toBe('q??????');
    expect(new URL(datamuseQueryUrl('cr', 5)).searchParams.get('sp')).toBe('cr???');
  });

  it('gathers every letter in parallel, reads frequencies, and caches per length', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const letter = new URL(url).searchParams.get('sp')![0];
      return okResponse(letter === 'c' ? [{ word: 'crane', tags: ['n', 'f:12.5'] }, { word: 'crate' }, { word: 'carla', tags: ['prop', 'f:3'] }] : []);
    });
    vi.stubGlobal('fetch', fetchMock);

    const words = await datamuseDictionarySource.loadDictionary(5, signal);
    expect(fetchMock).toHaveBeenCalledTimes(26);
    expect(words).toEqual([
      { word: 'crane', frequency: 12.5, properNoun: false },
      { word: 'crate', frequency: 0, properNoun: false },
      { word: 'carla', frequency: 3, properNoun: true },
    ]);

    await datamuseDictionarySource.loadDictionary(5, signal);
    expect(fetchMock).toHaveBeenCalledTimes(26);
    await datamuseDictionarySource.loadDictionary(6, signal);
    expect(fetchMock).toHaveBeenCalledTimes(52);
  });

  it('splits a query that comes back full one letter deeper, so capped results lose no words', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ word: `c${i}`, tags: ['f:1'] }));
    const fetchMock = vi.fn(async (url: string) => {
      const pattern = new URL(url).searchParams.get('sp')!;
      if (pattern === 'c????') return okResponse(full);
      if (pattern === 'cr???') return okResponse([{ word: 'crops', tags: ['f:17.6'] }]);
      return okResponse([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    const words = await datamuseDictionarySource.loadDictionary(5, signal);
    expect(fetchMock).toHaveBeenCalledTimes(26 + 26);
    expect(words).toContainEqual({ word: 'crops', frequency: 17.6, properNoun: false });
    expect(words).toHaveLength(1001);
  });

  it('turns any failure into a start-refusing game error, and caches nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response));
    await expect(datamuseDictionarySource.loadDictionary(5, signal)).rejects.toMatchObject({
      code: 'GAME_SETUP_FAILED',
      message: "Couldn't fetch words - try again",
    });

    vi.stubGlobal('fetch', vi.fn(async () => okResponse([{ nope: true }])));
    await expect(datamuseDictionarySource.loadDictionary(5, signal)).rejects.toMatchObject({ code: 'GAME_SETUP_FAILED' });
  });
});
