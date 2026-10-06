import type { TimedPhaseState } from '../shared/timedPhases';

// Fishbowl's state, actions and views. The view and action types are what the web client codes
// against (imported type-only via @inithium/game-session), so they're the game's wire contract.

export const FISHBOWL_GAME_ID = 'fishbowl';

// The catalogue record's settings (libs/db/src/game-seeds/fishbowl.game-seed.ts), as validated.
export type FishbowlSettings = {
  cluesPerPlayer: number;
  teamCount: number;
  turnSeconds: number;
  allowSkipping: boolean;
};

// 1 Taboo (describe), 2 Charades (act it out), 3 Password (one word) - all on the same bowl.
export type FishbowlRound = 1 | 2 | 3;

// setup - players fill the bowl; the host can rebalance teams
// ready - between turns: last turn's recap, and the next presenter taps Start turn (untimed)
// turn  - the presenter works through the bowl against the clock (timed)
// final - team standings, until the host takes everyone back to the lobby
export type FishbowlPhase = 'setup' | 'ready' | 'turn' | 'final';

// Why a turn's clock is stopped.
export type FishbowlPauseCause = 'host' | 'host-disconnected' | 'presenter-disconnected';

export interface FishbowlTeam {
  readonly id: string;
  readonly name: string;
  // A palette color name (red, blue, ...) the web app styles the team with.
  readonly color: string;
  readonly members: readonly string[];
  // Index into members of who presents next - the rotation carries on across rounds.
  readonly presenterCursor: number;
}

export interface FishbowlClue {
  readonly id: string;
  readonly text: string;
  readonly authorId: string;
}

export interface FishbowlTurnRecap {
  readonly teamId: string;
  readonly presenterId: string;
  readonly round: FishbowlRound;
  // The clues guessed this turn, in order.
  readonly guessed: readonly string[];
  readonly points: number;
  // The turn emptied the bowl, ending its round.
  readonly roundEnded: boolean;
}

export interface FishbowlState extends TimedPhaseState {
  readonly config: {
    readonly cluesPerPlayer: number;
    readonly turnMs: number;
    readonly allowSkipping: boolean;
  };
  readonly teams: readonly FishbowlTeam[];
  readonly clues: Readonly<Record<string, FishbowlClue>>;
  // Source of the next clue id.
  readonly clueSeq: number;
  readonly round: FishbowlRound;
  // Clue ids still to be guessed this round; during a turn the presenter's clue is bowl[0].
  readonly bowl: readonly string[];
  readonly phase: FishbowlPhase;
  readonly activeTeamIndex: number;
  readonly presenterId: string | null;
  // Clue ids guessed so far this turn (undo pops the last).
  readonly turnGuessed: readonly string[];
  readonly pauseCause: FishbowlPauseCause | null;
  // Per team id: points in rounds 1, 2 and 3.
  readonly scores: Readonly<Record<string, readonly [number, number, number]>>;
  readonly lastTurn: FishbowlTurnRecap | null;
  // A new round (with its new rule) begins with the coming turn.
  readonly roundJustStarted: boolean;
}

// ---- Actions (sent as { type: 'game:action', action }) ----

export type FishbowlHostAction =
  | { readonly type: 'move-player'; readonly payload: { readonly participantId: string; readonly teamId: string } }
  | { readonly type: 'begin' }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  // Ready: pass over this presenter. Turn: end the turn now.
  | { readonly type: 'skip' }
  | { readonly type: 'end' }
  | { readonly type: 'back-to-lobby' };

export type FishbowlPlayerAction =
  | { readonly type: 'submit-clue'; readonly payload: { readonly text: string } }
  | { readonly type: 'remove-clue'; readonly payload: { readonly clueId: string } }
  | { readonly type: 'start-turn' }
  | { readonly type: 'correct' }
  | { readonly type: 'skip-clue' }
  | { readonly type: 'undo' };

export type FishbowlAction = FishbowlHostAction | FishbowlPlayerAction;

// ---- Views ----

export interface FishbowlTeamView {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly members: readonly string[];
  readonly roundScores: readonly [number, number, number];
  readonly total: number;
  // Competition ranking by total - tied teams share a rank.
  readonly rank: number;
}

// Everyone - host screen and every phone. Never holds a clue that's still in play: only the clues
// a finished turn guessed (its recap).
export interface FishbowlPublicView {
  readonly phase: FishbowlPhase;
  readonly round: FishbowlRound;
  readonly roundCount: 3;
  readonly teams: readonly FishbowlTeamView[];
  readonly activeTeamId: string | null;
  readonly presenterId: string | null;
  readonly phaseEndsAt: string | null;
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  readonly pauseCause: FishbowlPauseCause | null;
  readonly turnMs: number;
  readonly allowSkipping: boolean;
  readonly cluesPerPlayer: number;
  // Per participant: how many clues they've put in (setup progress).
  readonly submitted: Readonly<Record<string, number>>;
  readonly bowlCount: number;
  readonly totalClues: number;
  // Guessed so far in the turn in progress.
  readonly turnPoints: number;
  readonly lastTurn: FishbowlTurnRecap | null;
  readonly roundJustStarted: boolean;
}

// One player's phone.
export interface FishbowlPrivateView {
  readonly teamId: string | null;
  readonly isPresenter: boolean;
  readonly cluesRequired: number;
  // Setup only: what they've put in, so they can fix a typo.
  readonly myClues: readonly { readonly id: string; readonly text: string }[];
  // The presenter's current clue, during their turn only.
  readonly currentClue: string | null;
  readonly canUndo: boolean;
}
