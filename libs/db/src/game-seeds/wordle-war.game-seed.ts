import type { CreateGameInput } from '../contracts/game.contract';

const wordleWarGameSeed: CreateGameInput = {
  slug: 'wordle-war',
  title: 'Wordle War',
  tagline: 'One secret word. Everyone races to crack it.',
  description:
    'Like the daily word puzzle, but head-to-head. Every round the whole room races to crack the same secret word on their own phones, with Wordle-style hints. The host screen shows everyone’s progress in colors only - you’ll see who’s closing in, never what they guessed.',
  imageUrl: '/games/wordle-war-logo.png',
  icon: 'GridFour',
  minPlayers: 2,
  maxPlayers: 20,
  estimatedMinutes: 10,
  tags: ['word', 'puzzle'],
  rules: [
    {
      title: 'One word',
      description: 'Each round everyone gets the same secret word of the chosen length and difficulty.',
    },
    {
      title: 'Guess',
      description:
        'Type real words on your phone. Each letter turns green (right spot), yellow (in the word, wrong spot) or gray (not in the word).',
    },
    {
      title: 'Race',
      description:
        'Solving first doesn’t end the round - everyone keeps going until they’ve solved it or run out of guesses. Run out and your board locks.',
    },
    {
      title: 'Score',
      description:
        'The first to solve earns 100 points, then 80, 65, 50 and 40 for everyone after - plus 10 for every guess you didn’t need.',
    },
    { title: 'Win', description: 'After the last round, the highest score wins.' },
  ],
  settings: [
    { key: 'wordLength', label: 'Letters in the word', type: 'number', default: 5, min: 3, max: 10, step: 1, unit: 'letters' },
    { key: 'maxGuesses', label: 'Guesses allowed', type: 'number', default: 6, min: 3, max: 8, step: 1, unit: 'guesses' },
    {
      key: 'difficulty',
      label: 'Difficulty',
      description: 'How obscure the secret words are - 1 is everyday words, 10 is rare vocabulary.',
      type: 'number',
      default: 5,
      min: 1,
      max: 10,
      step: 1,
    },
    { key: 'rounds', label: 'Rounds', description: 'A new word each round.', type: 'number', default: 3, min: 1, max: 10, step: 1, unit: 'rounds' },
    {
      key: 'revealSeconds',
      label: 'Reveal time',
      description: 'How long the word and leaderboard show before the next round.',
      type: 'number',
      default: 15,
      min: 5,
      max: 30,
      step: 1,
      unit: 'seconds',
    },
  ],
  requirements: [],
  order: 40,
  seedVersion: 4,
  isPublished: true,
};

export default wordleWarGameSeed;
