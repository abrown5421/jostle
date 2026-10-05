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
    {
      title: 'Score',
      description:
        'Up to 100 points for how close your color looks to the original, plus up to 50 more the sooner you lock in - the bonus shrinks the further off you are. Didn’t lock in? Whatever’s on your picker when time runs out still counts, just without the bonus.',
    },
    { title: 'Reveal', description: 'Everyone’s color is shown next to the original, then the next round starts.' },
    { title: 'Win', description: 'After the last round, the highest score wins.' },
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
    {
      key: 'endWhenAllAnswered',
      label: 'End early when everyone’s in',
      description: 'Skip to the reveal as soon as every player has locked in, instead of waiting out the guessing time.',
      type: 'boolean',
      default: true,
    },
    {
      key: 'revealSeconds',
      label: 'Reveal time',
      description: 'How long the results and leaderboard show before the next round.',
      type: 'number',
      default: 10,
      min: 5,
      max: 30,
      step: 1,
      unit: 'seconds',
    },
  ],
  requirements: [],
  order: 20,
  seedVersion: 3,
  isPublished: true,
};

export default pointOfHueGameSeed;
