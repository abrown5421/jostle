export const GAME_SESSION_ERROR_CODES = [
  'SESSION_NOT_FOUND',
  'SESSION_NOT_JOINABLE',
  'SESSION_FULL',
  'NAME_TAKEN',
  'INVALID_NAME',
  'NOT_AUTHORIZED',
  'PARTICIPANT_NOT_FOUND',
  'GAME_NOT_FOUND',
  'GAME_NOT_PLAYABLE',
  'GAME_IN_PROGRESS',
  'NO_GAME_SELECTED',
  'INVALID_SETTINGS',
  'NO_ACTIVE_GAME',
  'INVALID_PLAYER_COUNT',
  'INVALID_ACTION',
] as const;
export type GameSessionErrorCode = (typeof GAME_SESSION_ERROR_CODES)[number];

// Transport-agnostic on purpose: the REST route maps these onto @inithium/api-utils' AppError
// HTTP statuses, the WS gateway relays them as {type:'error'} frames - this lib knows neither.
export class GameSessionError extends Error {
  readonly code: GameSessionErrorCode;

  constructor(code: GameSessionErrorCode, message: string) {
    super(message);
    this.name = 'GameSessionError';
    this.code = code;
  }
}

export const isGameSessionError = (error: unknown): error is GameSessionError => error instanceof GameSessionError;
