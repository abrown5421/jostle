import type { GameContext } from '../../contracts/game-definition.contract';
import { GameSessionError } from '../../service/session.errors';

// Payload-reading and permission helpers every game's reducer needs - action payloads come
// straight off a socket, so nothing about their shape is trusted.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const invalidAction = (message: string): GameSessionError => new GameSessionError('INVALID_ACTION', message);

export const requireRole = (context: GameContext, role: 'host' | 'player' | 'system'): void => {
  if (context.actor.role !== role) throw new GameSessionError('NOT_AUTHORIZED', `Only the ${role} can do that`);
};

// A SYSTEM_ACTIONS.hostConnection payload's verdict.
export const isHostConnected = (payload: unknown): boolean => isRecord(payload) && payload['connected'] === true;
