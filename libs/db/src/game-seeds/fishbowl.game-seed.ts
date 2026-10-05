import type { CreateGameInput } from '../contracts/game.contract';

const fishbowlGameSeed: CreateGameInput = {
  slug: 'fishbowl',
  title: 'Fishbowl',
  tagline: 'Password, Taboo, then Charades - with the same bowl of clues.',
  description:
    'Everyone secretly drops clues into a communal fishbowl, then splits into teams. Over three rounds - Password, Taboo, and Charades - teams take turns sending up a presenter who works through as many clues as they can before the timer runs out. The same clues come back every round, so pay attention.',
  imageUrl: '/games/fishbowl-logo.png',
  icon: 'Fish',
  minPlayers: 4,
  maxPlayers: 20,
  estimatedMinutes: 45,
  tags: ['teams', 'party', 'word'],
  rules: [
    {
      title: 'Fill the bowl',
      description: 'Every player secretly submits their clues. All clues go into one shared fishbowl.',
    },
    {
      title: 'Take turns',
      description:
        'Teams alternate. Each turn one player presents while their teammates guess. Clues appear on the presenter’s device; tap Got it - or Skip, when skipping is allowed - on the honor system.',
    },
    { title: 'Round 1 - Password', description: 'Describe the clue using a single word.' },
    { title: 'Round 2 - Taboo', description: 'Say anything except the words on the clue itself.' },
    { title: 'Round 3 - Charades', description: 'No talking - act it out.' },
    {
      title: 'Next round',
      description: 'Once the bowl is empty, points are awarded, every clue goes back in, and the next round begins.',
    },
  ],
  settings: [
    { key: 'cluesPerPlayer', label: 'Clues per player', type: 'number', default: 3, min: 1, max: 10, step: 1, unit: 'clues' },
    { key: 'teamCount', label: 'Teams', type: 'number', default: 2, min: 2, max: 5, step: 1, unit: 'teams' },
    {
      key: 'turnSeconds',
      label: 'Turn timer',
      type: 'number',
      default: 60,
      min: 30,
      max: 180,
      step: 5,
      unit: 'seconds',
    },
    {
      key: 'allowSkipping',
      label: 'Allow skipping',
      description: 'Lets the presenter put a clue back in the bowl and draw another.',
      type: 'boolean',
      default: true,
    },
  ],
  requirements: [],
  order: 30,
  seedVersion: 2,
  isPublished: true,
};

export default fishbowlGameSeed;
