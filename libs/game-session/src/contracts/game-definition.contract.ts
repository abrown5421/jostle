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

// 'system' is the session service itself - a timer firing (nextTimeout) or a SYSTEM_ACTIONS
// notification. No socket can ever act as it: the gateway builds every client's actor from that
// client's credential, which is only ever 'host' or 'player'.
export type GameActorRole = SessionRole | 'system';

export interface GameActor {
  readonly role: GameActorRole;
  readonly participantId: string | null;
}

// Actions the session service dispatches on its own (actor role 'system') while a game is running,
// so a game can react to the room changing under it. A game that doesn't care simply returns its
// state unchanged for any action type it doesn't recognise.
export const SYSTEM_ACTIONS = {
  // A participant joined back, left, was kicked, or their connection dropped/returned. The
  // context's `participants` is already the new list. No payload.
  participantsChanged: 'system:participants-changed',
  // The host screen's connection dropped (or came back). payload: { connected: boolean }
  hostConnection: 'system:host-connection',
} as const;

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
  // The account hosting the session - what a game uses to reach the host's own integrations.
  readonly hostUserId: string;
}

export interface GamePrepareContext<TSettings extends GameSettingValues = GameSettingValues> extends GameSetupContext<TSettings> {
  // Aborted if preparing takes too long; pass it on to any network call.
  readonly signal: AbortSignal;
}

// "Dispatch `action` as the system at `at`" - see GameDefinition.nextTimeout.
export interface GameTimeout {
  readonly at: string;
  readonly action: GameAction;
}

export interface GameActionResult<TState> {
  readonly state: TState;
  // Added onto the session's running scores, keyed by participant id.
  readonly scoreDeltas?: Readonly<Record<string, number>>;
  // Ends the game and returns the session to 'lobby' (scores and the game selection are kept).
  readonly complete?: boolean;
}

export interface GameDefinition<TState = unknown, TSettings extends GameSettingValues = GameSettingValues, TPrepared = undefined> {
  // Must equal the game's catalogue slug.
  readonly id: string;
  // Rules the generic per-setting validation can't express - anything spanning several settings
  // or depending on who's in the session (e.g. Fishbowl needing at least two players per team).
  // Throw GameSessionError('INVALID_SETTINGS', ...) to refuse the start; the host sees the message.
  validateSettings?: (context: GameSetupContext<TSettings>) => void;
  // The one async, network-allowed step: anything the game needs fetched before it can start
  // (iPod War loads the host's playlist). Runs after validateSettings and outside the session's
  // lock, so the lobby stays live while it works; the session re-checks nothing changed before
  // starting. Throw a GameSessionError to refuse the start - its message reaches the host.
  prepare?: (context: GamePrepareContext<TSettings>) => Promise<TPrepared>;
  // `prepared` is whatever prepare resolved to (undefined for a game without one).
  createInitialState: (context: GameSetupContext<TSettings>, prepared: TPrepared) => TState;
  // Throw a GameSessionError('INVALID_ACTION', ...) to reject an action - it's relayed to the
  // sender only and the state is left untouched.
  handleAction: (state: TState, action: GameAction, context: GameContext) => GameActionResult<TState>;
  // The game's next timed event, derived from its state: the service (re)arms one timer from this
  // after every change and dispatches `action` as the system when it's due. Return null when
  // nothing is timed (including while paused). Because it's re-derived every time, a timer can
  // never outlive the state that asked for it - but a game should still tag its timer actions
  // (e.g. with a sequence number) and ignore stale ones, as one may already be in flight.
  nextTimeout?: (state: TState) => GameTimeout | null;
  // What every screen (host + all players) sees. Omitted -> null; raw state is never broadcast.
  publicView?: (state: TState) => unknown;
  // What the host screen alone sees - may hold what players mustn't (the answer, the song to play).
  hostView?: (state: TState) => unknown;
  // What one specific player's device sees (their hand, their prompt, ...).
  privateView?: (state: TState, participantId: string) => unknown;
}
