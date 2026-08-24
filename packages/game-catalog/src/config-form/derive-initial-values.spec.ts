import { describe, expect, it } from 'vitest';
import { deriveInitialValues } from './derive-initial-values.js';
import type { DynamicSettingFieldDefinition } from './types.js';

describe('deriveInitialValues', () => {
  it('builds a map from each field key to its defaultValue', () => {
    const schema: DynamicSettingFieldDefinition[] = [
      { key: 'songBankSize', label: 'Song Bank Size', type: 'number', defaultValue: 20 },
      { key: 'enableArtistGuess', label: 'Enable Artist Guess', type: 'boolean', defaultValue: true },
      { key: 'playlistSourceUrl', label: 'Playlist Source URL', type: 'string', defaultValue: '' },
    ];

    expect(deriveInitialValues(schema)).toEqual({
      songBankSize: 20,
      enableArtistGuess: true,
      playlistSourceUrl: '',
    });
  });

  it('returns an empty map for an empty schema', () => {
    expect(deriveInitialValues([])).toEqual({});
  });
});
