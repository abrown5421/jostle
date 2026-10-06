import type { IconName } from '@inithium/ui';
import type { FishbowlRound } from '@inithium/game-session';

export interface RoundRule {
  readonly title: string;
  readonly rule: string;
  readonly icon: IconName;
}

// The one source for each round's name and rule - the host's round banner and the presenter's
// phone both read it.
export const ROUND_RULES: Readonly<Record<FishbowlRound, RoundRule>> = {
  1: { title: 'Taboo', rule: 'Describe it out loud - no saying any of its words, and no rhymes.', icon: 'ChatsCircle' },
  2: { title: 'Charades', rule: 'Act it out in silence - no talking and no sound effects.', icon: 'HandWaving' },
  3: { title: 'Password', rule: 'Exactly one word per clue.', icon: 'Key' },
};
