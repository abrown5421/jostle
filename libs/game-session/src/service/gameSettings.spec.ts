import { describe, expect, it } from 'vitest';
import type { GameSettingDefinition } from '@inithium/db';
// Deep import on purpose: the @inithium/db barrel pulls in mongoose, and the seeds are plain data.
import { gameSeeds } from '@inithium/db/src/game-seeds/registry';
import {
  applyGameSettingsPatch,
  assertValidGameSettingDefinitions,
  defaultGameSettings,
  findMissingRequiredSettings,
  resolveGameSettings,
} from './gameSettings';

const DEFINITIONS: GameSettingDefinition[] = [
  { key: 'seconds', label: 'Seconds', type: 'number', default: 30, min: 15, max: 60, step: 15 },
  { key: 'artist', label: 'Artist', type: 'boolean', default: true },
  {
    key: 'difficulty',
    label: 'Difficulty',
    type: 'select',
    default: 'normal',
    options: [
      { value: 'easy', label: 'Easy' },
      { value: 'normal', label: 'Normal' },
    ],
  },
];

describe('game settings', () => {
  it('builds defaults from the definitions', () => {
    expect(defaultGameSettings(DEFINITIONS)).toEqual({ seconds: 30, artist: true, difficulty: 'normal' });
  });

  it('applies a valid partial patch and leaves the rest alone', () => {
    const current = defaultGameSettings(DEFINITIONS);
    expect(applyGameSettingsPatch(DEFINITIONS, current, { seconds: 45, difficulty: 'easy' })).toEqual({
      seconds: 45,
      artist: true,
      difficulty: 'easy',
    });
    expect(current.seconds).toBe(30);
  });

  it.each([
    ['off the step grid', { seconds: 20 }],
    ['below min', { seconds: 0 }],
    ['above max', { seconds: 75 }],
    ['NaN', { seconds: Number.NaN }],
    ['a string number', { seconds: '30' }],
    ['a non-boolean toggle', { artist: 1 }],
    ['an unknown option', { difficulty: 'hard' }],
    ['an unknown key', { bonus: true }],
    ['not an object', ['seconds', 30]],
  ])('rejects %s', (_label, patch) => {
    expect(() => applyGameSettingsPatch(DEFINITIONS, defaultGameSettings(DEFINITIONS), patch)).toThrow(
      expect.objectContaining({ code: 'INVALID_SETTINGS' }),
    );
  });

  it('resolves stored settings against changed definitions: drops removed keys, defaults new ones', () => {
    const stored = { seconds: 45, removed: 'x' };
    expect(resolveGameSettings(DEFINITIONS, stored)).toEqual({ seconds: 45, artist: true, difficulty: 'normal' });
  });

  it('rejects incoherent definitions', () => {
    expect(() =>
      assertValidGameSettingDefinitions([{ key: 'n', label: 'N', type: 'number', default: 99, min: 1, max: 10 }]),
    ).toThrow();
    expect(() =>
      assertValidGameSettingDefinitions([
        { key: 'a', label: 'A', type: 'boolean', default: true },
        { key: 'a', label: 'A again', type: 'boolean', default: false },
      ]),
    ).toThrow();
  });

  describe('integration-resource settings', () => {
    const RESOURCE_DEFINITIONS: GameSettingDefinition[] = [
      { key: 'count', label: 'Songs', type: 'number', default: 30, min: 1, max: 100 },
      {
        key: 'playlist',
        label: 'Playlist',
        type: 'integration-resource',
        default: '',
        provider: 'spotify',
        resource: 'playlist',
        required: true,
        minItemsFromSetting: 'count',
      },
    ];

    it('accepts a provider id or nothing, and rejects anything that is not an id', () => {
      const current = defaultGameSettings(RESOURCE_DEFINITIONS);
      expect(applyGameSettingsPatch(RESOURCE_DEFINITIONS, current, { playlist: '37i9dQZF1DXcBWIGoYBM5M' }).playlist).toBe(
        '37i9dQZF1DXcBWIGoYBM5M',
      );
      expect(applyGameSettingsPatch(RESOURCE_DEFINITIONS, current, { playlist: '' }).playlist).toBe('');
      for (const playlist of [42, 'has spaces', '../etc', 'x'.repeat(129)]) {
        expect(() => applyGameSettingsPatch(RESOURCE_DEFINITIONS, current, { playlist })).toThrow(
          expect.objectContaining({ code: 'INVALID_SETTINGS' }),
        );
      }
    });

    it('reports required resources that are still unset', () => {
      expect(findMissingRequiredSettings(RESOURCE_DEFINITIONS, { count: 30, playlist: '' }).map(({ key }) => key)).toEqual(['playlist']);
      expect(findMissingRequiredSettings(RESOURCE_DEFINITIONS, { count: 30, playlist: 'abc' })).toEqual([]);
    });

    it('rejects a definition with a non-empty default or a minItemsFromSetting that is not a number setting', () => {
      const [count, playlist] = RESOURCE_DEFINITIONS;
      expect(() => assertValidGameSettingDefinitions(RESOURCE_DEFINITIONS)).not.toThrow();
      expect(() => assertValidGameSettingDefinitions([count, { ...playlist, default: 'abc' } as GameSettingDefinition])).toThrow();
      expect(() => assertValidGameSettingDefinitions([{ ...playlist, minItemsFromSetting: 'missing' } as GameSettingDefinition])).toThrow();
    });
  });

  it.each(gameSeeds.map((seed) => [seed.slug, seed] as const))('seeded game "%s" has a valid catalogue record', (_slug, seed) => {
    expect(() => assertValidGameSettingDefinitions(seed.settings)).not.toThrow();
    expect(seed.minPlayers).toBeGreaterThanOrEqual(1);
    expect(seed.maxPlayers).toBeGreaterThanOrEqual(seed.minPlayers);
  });
});
