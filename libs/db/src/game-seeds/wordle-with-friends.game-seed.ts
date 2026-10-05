import type { CreateGameInput } from '../contracts/game.contract';

// No art yet - the catalogue card falls back to `icon`.
const wordleWithFriendsGameSeed: CreateGameInput = {
  slug: 'wordle-with-friends',
  title: 'Wordle W Friends',
  tagline: 'Everyone gets a secret word. Crack yours first.',
  description:
    'Like the daily word puzzle, but head-to-head. Each player is dealt their own random secret word and races to solve it with Wordle-style hints. Solving in fewer guesses beats solving fast - a player who gets it in one outranks a player who took three.',
  icon: 'GridFour',
  minPlayers: 2,
  maxPlayers: 20,
  estimatedMinutes: 10,
  tags: ['word', 'puzzle'],
  rules: [
    {
      title: 'Your word',
      description: 'Each player is assigned their own random secret word of the chosen length and difficulty.',
    },
    {
      title: 'Guess',
      description:
        'Submit guesses on your device. Each letter is marked as in the right spot, in the word but elsewhere, or not in the word.',
    },
    {
      title: 'Score',
      description: 'Players are ranked by fewest guesses, then speed. Running out of guesses scores partial credit for accuracy.',
    },
  ],
  settings: [
    { key: 'wordLength', label: 'Letters in the word', type: 'number', default: 5, min: 3, max: 10, step: 1, unit: 'letters' },
    { key: 'maxGuesses', label: 'Guesses allowed', type: 'number', default: 6, min: 3, max: 8, step: 1, unit: 'guesses' },
    {
      key: 'difficulty',
      label: 'Difficulty',
      description: 'How obscure the secret words are - 1 is everyday words, 10 is deep vocabulary.',
      type: 'number',
      default: 5,
      min: 1,
      max: 10,
      step: 1,
    },
  ],
  requirements: [],
  order: 40,
  seedVersion: 2,
  isPublished: true,
};

export default wordleWithFriendsGameSeed;
