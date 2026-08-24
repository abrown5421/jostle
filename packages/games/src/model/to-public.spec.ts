import { describe, expect, it } from 'vitest';
import { toPublicGame } from './to-public.js';
import type { GameDocument } from './types.js';

describe('toPublicGame', () => {
  it('maps _id to gameId and preserves every other field', () => {
    const document: GameDocument = {
      _id: 'fishbowl',
      title: 'Fishbowl',
      description: 'A party game.',
      coverImageUrl: 'https://example.com/fishbowl.png',
      minPlayers: 4,
      maxPlayers: 16,
      defaultSettingsSchema: [
        { key: 'roundCount', label: 'Round Count', type: 'number', defaultValue: 3, min: 1, max: 5, step: 1 },
      ],
    };

    expect(toPublicGame(document)).toEqual({
      gameId: 'fishbowl',
      title: 'Fishbowl',
      description: 'A party game.',
      coverImageUrl: 'https://example.com/fishbowl.png',
      minPlayers: 4,
      maxPlayers: 16,
      defaultSettingsSchema: [
        { key: 'roundCount', label: 'Round Count', type: 'number', defaultValue: 3, min: 1, max: 5, step: 1 },
      ],
    });
  });
});
