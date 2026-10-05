import type { GameSettingValues } from '@inithium/db';
import type { SessionParticipant, SessionRole } from './session.contract';

// The extension point every Jostle game implements. Games are server-authoritative pure
// reducers: clients only ever send GameActions, the server applies them here and broadcasts the
// resulting views - no client is trusted to compute state or scores.
//
// Everything *descriptive* about a game - title, art, rules, player counts, and the shape of its
// settings - lives in its game catalogue record (@inithium/db's GameEntity, slug === this id), not
// here. That record is what the catalogue page, the settings screen, and startGame's player-count
// check all read, so this file is purely gameplay.
export interface GameAction {
  readonly type: string;
  readonly payload?: unknown;
}

export interface GameActor {
  readonly role: SessionRole;
  readonly participantId: string | null;
}

export interface GameContext {
  readonly participants: readonly SessionParticipant[];
  readonly actor: GameActor;
  readonly now: string;
}

// Handed to a game once, when it starts. `settings` is the host's configuration, already
// validated against the catalogue record's setting definitions (types, ranges, options).
export interface GameSetupContext<TSettings extends GameSettingValues = GameSettingValues> {
  readonly participants: readonly SessionParticipant[];
  readonly settings: TSettings;
  readonly now: string;
}

export interface GameActionResult<TState> {
  readonly state: TState;
  // Added onto the session's running scores, keyed by participant id.
  readonly scoreDeltas?: Readonly<Record<string, number>>;
  // Ends the game and returns the session to 'lobby' (scores and the game selection are kept).
  readonly complete?: boolean;
}

export interface GameDefinition<TState = unknown, TSettings extends GameSettingValues = GameSettingValues> {
  // Must equal the game's catalogue slug.
  readonly id: string;
  // Rules the generic per-setting validation can't express - anything spanning several settings
  // or depending on who's in the session (e.g. Fishbowl needing at least two players per team).
  // Throw GameSessionError('INVALID_SETTINGS', ...) to refuse the start; the host sees the message.
  validateSettings?: (context: GameSetupContext<TSettings>) => void;
  createInitialState: (context: GameSetupContext<TSettings>) => TState;
  // Throw a GameSessionError('INVALID_ACTION', ...) to reject an action - it's relayed to the
  // sender only and the state is left untouched.
  handleAction: (state: TState, action: GameAction, context: GameContext) => GameActionResult<TState>;
  // What every screen (host + all players) sees. Omitted -> null; raw state is never broadcast.
  publicView?: (state: TState) => unknown;
  // What one specific player's device sees (their hand, their prompt, ...).
  privateView?: (state: TState, participantId: string) => unknown;
}
