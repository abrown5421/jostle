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
      description: 'Every player secretly submits their clues from their phone. All clues go into one shared fishbowl.',
    },
    {
      title: 'Take turns',
      description:
        'Teams alternate. Each turn one player presents while their teammates guess against the clock. Clues appear on the presenter’s phone; tap Correct - or Skip, when skipping is allowed - on the honor system.',
    },
    { title: 'Round 1 - Taboo', description: 'Describe the clue out loud - no saying any of its words, and no rhymes.' },
    { title: 'Round 2 - Charades', description: 'Act it out in silence - no talking and no sound effects.' },
    { title: 'Round 3 - Password', description: 'Give exactly one word per clue.' },
    {
      title: 'Next round',
      description: 'Once the bowl is empty the round ends, every clue goes back in, and the next round begins with the next team.',
    },
    { title: 'Win', description: 'Every correct clue is a point for your team. After round 3, the team with the most points wins.' },
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
  seedVersion: 3,
  isPublished: true,
};

export default fishbowlGameSeed;
