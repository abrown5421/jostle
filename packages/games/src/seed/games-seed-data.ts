import { images } from '@jostle/assets';
import type { GameDocument } from '../model/index.js';

export const GAMES_SEED_DATA: ReadonlyArray<GameDocument> = [
  {
    _id: 'ipod-war',
    title: 'iPod War',
    description: 'Guess the song, artist, or album from short clips before your rivals do.',
    coverImageUrl: images.gameLogos.ipodWar,
    minPlayers: 2,
    maxPlayers: 12,
    defaultSettingsSchema: [
      { key: 'playlistSourceUrl', label: 'Playlist Source URL', type: 'string', defaultValue: '' },
      { key: 'songBankSize', label: 'Song Bank Size', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
      { key: 'clipDurationSeconds', label: 'Clip Duration (seconds)', type: 'number', defaultValue: 15, min: 5, max: 60, step: 1 },
      { key: 'enableArtistGuess', label: 'Enable Artist Guess', type: 'boolean', defaultValue: true },
      { key: 'enableAlbumGuess', label: 'Enable Album Guess', type: 'boolean', defaultValue: false },
      { key: 'difficultyRating', label: 'Difficulty Rating', type: 'number', defaultValue: 5, min: 1, max: 10, step: 1 },
    ],
  },
  {
    _id: 'point-of-hue',
    title: 'Point of Hue',
    description: 'Memorize a sequence of colors, then reproduce it under pressure.',
    coverImageUrl: images.gameLogos.pointOfHue,
    minPlayers: 3,
    maxPlayers: 8,
    defaultSettingsSchema: [
      {
        key: 'colorPreviewDurationSeconds',
        label: 'Color Preview Duration (seconds)',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 1,
      },
      {
        key: 'memoryPhaseTimerSeconds',
        label: 'Memory Phase Timer (seconds)',
        type: 'number',
        defaultValue: 10,
        min: 5,
        max: 60,
        step: 1,
      },
    ],
  },
  {
    _id: 'fishbowl',
    title: 'Fishbowl',
    description: 'Describe, act out, and one-word your way through three escalating rounds of the same clue pile.',
    coverImageUrl: images.gameLogos.fishbowl,
    minPlayers: 4,
    maxPlayers: 16,
    defaultSettingsSchema: [
      { key: 'secretWordsPerPlayer', label: 'Secret Words Per Player', type: 'number', defaultValue: 3, min: 1, max: 10, step: 1 },
      { key: 'turnDurationSeconds', label: 'Turn Duration (seconds)', type: 'number', defaultValue: 45, min: 10, max: 120, step: 5 },
      {
        key: 'roundCount',
        label: 'Round Count (Verbal, Charades, Single Word)',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
  },
];
