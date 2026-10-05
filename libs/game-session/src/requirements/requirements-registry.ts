import type { GameRequirement } from '@inithium/db';

// One unmet requirement, with a host-facing explanation ("Connect your Spotify account").
export interface GameRequirementBlocker {
  readonly requirement: GameRequirement;
  readonly reason: string;
}

// Whether a user meets a game's host requirements. Swappable like GameCatalog: apps/api wires in
// one backed by @inithium/integrations at boot, so this lib never imports integration code.
export interface GameRequirementEvaluator {
  readonly name: string;
  // Every unmet requirement - an empty list means the user may host.
  evaluate: (userId: string, requirements: readonly GameRequirement[]) => Promise<GameRequirementBlocker[]>;
}

// Until one is wired in, nothing is enforced - tests and a bare lib behave as before requirements
// existed. apps/api always wires the real one.
const permissiveEvaluator: GameRequirementEvaluator = {
  name: 'Permissive (no requirement evaluator configured)',
  evaluate: async () => [],
};

// Same shared-mutable-reference recipe as catalog/catalog-registry.ts.
let current: GameRequirementEvaluator = permissiveEvaluator;

export const setActiveRequirementEvaluator = (evaluator: GameRequirementEvaluator): void => {
  current = evaluator;
};

export const getActiveRequirementEvaluator = (): GameRequirementEvaluator => current;
