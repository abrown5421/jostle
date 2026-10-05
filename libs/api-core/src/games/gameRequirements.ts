import type { GameRequirementBlocker, GameRequirementEvaluator } from '@inithium/game-session';
import { evaluateIntegrationRequirements } from '@inithium/integrations';

// Judges a game's host requirements (GameEntity.requirements) for one user. @inithium/game-session
// enforces them on pick/start through this (wired in at boot by configureGameRuntime), and the
// catalogue route reports them per user so a card can explain itself before anyone clicks.
export const gameRequirementEvaluator: GameRequirementEvaluator = {
  name: 'Integrations',
  evaluate: async (userId, requirements) => {
    // 'integration' is the only kind so far; a new kind gets its own branch alongside this one.
    const integrationRequirements = requirements.filter((requirement) => requirement.kind === 'integration');
    const reasons = await evaluateIntegrationRequirements(userId, integrationRequirements);
    return integrationRequirements.flatMap((requirement, index): GameRequirementBlocker[] => {
      const reason = reasons[index];
      return reason ? [{ requirement, reason }] : [];
    });
  },
};
