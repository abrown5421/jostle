import type { PlayerStanding } from '../shared/roster';

// iPod War's state, actions and views. The view and action types are what the web client codes
// against (imported type-only via @inithium/game-session), so they're the game's wire contract.

export const IPOD_WAR_GAME_ID = 'ipod-war';

// The catalogue record's settings (libs/db/src/game-seeds/ipod-war.game-seed.ts), as validated.
export type IpodWarSettings = {
  playlistId: string;
  songCount: number;
  playbackSeconds: number;
  endWhenAllAnswered: boolean;
  revealSeconds: number;
  nameArtist: boolean;
  nameAlbum: boolean;
  difficulty: number;
};

export type IpodWarField = 'title' | 'artist' | 'album';

export interface IpodWarTrack {
  readonly id: string;
  readonly uri: string;
  readonly title: string;
  readonly artists: readonly string[];
  readonly album: string;
  readonly albumImageUrl?: string;
  readonly durationMs: number;
}

export interface IpodWarSong extends IpodWarTrack {
  // Where in the track the clip starts - random, but always leaving room for the whole clip.
  readonly clipStartMs: number;
}

export interface IpodWarPlaylist {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
}

// countdown - "get ready" before the first song (timed)
// loading   - waiting for the host screen to report the clip actually started playing (untimed)
// playing   - the clip is playing and players can lock in (timed: the clip length)
// reveal    - answers + leaderboard (timed: the reveal length), then the next song
// final     - the podium, until the host takes everyone back to the lobby
export type IpodWarPhase = 'countdown' | 'loading' | 'playing' | 'reveal' | 'final';

export type IpodWarGuesses = Partial<Record<IpodWarField, string>>;

export interface IpodWarFieldGrade {
  readonly guess: string;
  readonly correct: boolean;
  readonly points: number;
}

export interface IpodWarGrade {
  readonly fields: Partial<Record<IpodWarField, IpodWarFieldGrade>>;
  // Added to each correct field.
  readonly speedBonus: number;
  readonly points: number;
  // How far into the clip they locked in.
  readonly elapsedMs: number;
}

export interface IpodWarSongResult {
  readonly songIndex: number;
  // Ended by the host's Skip rather than the clip running out (or everyone answering).
  readonly skipped: boolean;
  readonly grades: Readonly<Record<string, IpodWarGrade>>;
}

export interface IpodWarState {
  readonly config: {
    readonly playbackMs: number;
    readonly revealMs: number;
    readonly endWhenAllAnswered: boolean;
    readonly fields: readonly IpodWarField[];
    readonly difficulty: number;
  };
  readonly playlist: IpodWarPlaylist;
  readonly songs: readonly IpodWarSong[];
  readonly index: number;
  readonly phase: IpodWarPhase;
  // When the current timed phase ends (server time). Null while paused or in an untimed phase.
  readonly phaseEndsAt: string | null;
  // What was left of the timed phase when it was paused.
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  // Paused by the game itself because the host screen dropped, rather than by the host.
  readonly autoPaused: boolean;
  // Bumped on every phase change, pause and resume; timer actions carry it, so a stale one (fired
  // just as the host skipped, say) is recognised and ignored.
  readonly timerSeq: number;
  // Who's playing: everyone seated at the start, minus anyone who leaves or is kicked.
  readonly roster: readonly string[];
  // This song's lock-ins, already graded - kept hidden until the reveal.
  readonly submissions: Readonly<Record<string, IpodWarSubmission>>;
  readonly results: readonly IpodWarSongResult[];
  readonly totals: Readonly<Record<string, number>>;
  readonly playback: {
    // The host browser's Spotify player device that should be playing (several host tabs may be
    // open; only this one plays).
    readonly deviceId: string | null;
    // Bumped whenever the host screen should (re)start the current clip.
    readonly attempt: number;
    readonly error: string | null;
  };
}

export interface IpodWarSubmission {
  readonly guesses: IpodWarGuesses;
  readonly grade: IpodWarGrade;
}

// ---- Actions (sent as { type: 'game:action', action }) ----

export type IpodWarHostAction =
  | { readonly type: 'claim-audio'; readonly payload: { readonly deviceId: string } }
  | { readonly type: 'playback-started'; readonly payload: { readonly index: number; readonly attempt: number } }
  | {
      readonly type: 'playback-failed';
      readonly payload: { readonly index: number; readonly attempt: number; readonly message: string };
    }
  | { readonly type: 'retry-playback' }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'skip' }
  | { readonly type: 'end' }
  | { readonly type: 'back-to-lobby' };

export type IpodWarPlayerAction = { readonly type: 'submit'; readonly payload: IpodWarGuesses };

export type IpodWarAction = IpodWarHostAction | IpodWarPlayerAction;

// ---- Views ----

// delta = points from the song just revealed (0 outside the reveal).
export type IpodWarStanding = PlayerStanding;

export interface IpodWarAnswer {
  readonly title: string;
  readonly artists: readonly string[];
  readonly album: string;
  readonly albumImageUrl?: string;
}

// Everyone - host screen and every phone. Never names the current song before its reveal.
export interface IpodWarPublicView {
  readonly phase: IpodWarPhase;
  readonly songNumber: number;
  readonly songCount: number;
  readonly playlist: { readonly name: string; readonly imageUrl?: string };
  readonly fields: readonly IpodWarField[];
  readonly phaseEndsAt: string | null;
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  readonly autoPaused: boolean;
  readonly playbackMs: number;
  readonly revealMs: number;
  readonly roster: readonly string[];
  readonly lockedIn: readonly string[];
  readonly audioProblem: boolean;
  readonly standings: readonly IpodWarStanding[];
  // Only in the reveal.
  readonly answer: IpodWarAnswer | null;
}

// The host screen only - what to play.
export interface IpodWarHostView {
  readonly phase: IpodWarPhase;
  readonly songIndex: number;
  readonly song: (IpodWarAnswer & { readonly uri: string; readonly clipStartMs: number; readonly durationMs: number }) | null;
  readonly paused: boolean;
  readonly phaseEndsAt: string | null;
  readonly pausedRemainingMs: number | null;
  readonly playbackMs: number;
  readonly playback: IpodWarState['playback'];
}

export interface IpodWarFieldResult extends IpodWarFieldGrade {
  // The right answer, for display ("Queen, David Bowie" for artists).
  readonly answer: string;
}

// One player's phone.
export interface IpodWarPrivateView {
  readonly isPlaying: boolean;
  // This song's lock-in, if any.
  readonly guesses: IpodWarGuesses | null;
  // In the reveal: how this song's lock-in scored, field by field. Null if they didn't lock in.
  readonly result: {
    readonly fields: Partial<Record<IpodWarField, IpodWarFieldResult>>;
    readonly speedBonus: number;
    readonly points: number;
  } | null;
  readonly total: number;
  readonly rank: number | null;
  readonly playerCount: number;
}
