import type { CreateGameInput } from '../contracts/game.contract';

const pointOfHueGameSeed: CreateGameInput = {
  slug: 'point-of-hue',
  title: 'Point of Hue',
  tagline: 'Memorize a color, then match it from memory.',
  description:
    'A color swatch flashes on the host screen. When it disappears, everyone grabs the color picker on their device and tries to recreate it from memory before time runs out. The closer and faster your match, the more points you earn.',
  imageUrl: '/games/point-of-hue-logo.png',
  icon: 'Palette',
  minPlayers: 2,
  maxPlayers: 20,
  estimatedMinutes: 15,
  tags: ['memory', 'color', 'speed'],
  rules: [
    { title: 'Look', description: 'A color swatch shows on the host screen for the viewing time.' },
    { title: 'Match', description: 'Once it’s gone, use the color picker on your device to recreate it before the guessing time runs out.' },
    { title: 'Score', description: 'Answers are graded on accuracy, completeness, and how quickly you locked in.' },
  ],
  settings: [
    { key: 'rounds', label: 'Rounds', type: 'number', default: 10, min: 5, max: 60, step: 1, unit: 'rounds' },
    {
      key: 'viewSeconds',
      label: 'Viewing time',
      description: 'How long the swatch stays on screen.',
      type: 'number',
      default: 10,
      min: 5,
      max: 60,
      step: 1,
      unit: 'seconds',
    },
    {
      key: 'guessSeconds',
      label: 'Guessing time',
      description: 'How long players have to submit a match.',
      type: 'number',
      default: 60,
      min: 30,
      max: 180,
      step: 5,
      unit: 'seconds',
    },
  ],
  order: 20,
  seedVersion: 2,
  isPublished: true,
};

export default pointOfHueGameSeed;
