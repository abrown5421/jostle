export interface AggregatedPlaylistOption {
  readonly playlistId: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly trackCount: number;
  readonly contributedByDisplayName: string;
}

export type IpodWarPhase = 'idle' | 'playback' | 'results' | 'ended';

export interface IpodWarRoundSong {
  readonly trackUri: string;
  readonly trackId: string;
  readonly trackName: string;
  readonly artistNames: ReadonlyArray<string>;
  readonly albumName: string;
  readonly albumImageUrl: string | null;
  readonly durationMs: number;
}

export interface IpodWarRoundAnswer {
  readonly trackName: string;
  readonly artistNames: ReadonlyArray<string>;
  readonly albumName: string;
  readonly albumImageUrl: string | null;
}

export interface IpodWarPlayerResult {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly submitted: boolean;
  readonly pointsAwarded: number;
  readonly guess?: {
    readonly trackName?: string;
    readonly artistName?: string;
    readonly albumName?: string;
  };
}

export interface IpodWarLeaderboardEntry {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly totalPoints: number;
  readonly rank: number;
}

export interface IpodWarRoundResults {
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly isFinalRound: boolean;
  readonly correctAnswer: IpodWarRoundAnswer;
  readonly perPlayerResults: ReadonlyArray<IpodWarPlayerResult>;
  readonly leaderboard: ReadonlyArray<IpodWarLeaderboardEntry>;
  readonly phaseEndsAt: string;
}

export interface IpodWarSubmissionGuess {
  readonly trackName: string;
  readonly artistName?: string;
  readonly albumName?: string;
}

export interface IpodWarSnapshot {
  readonly phase: IpodWarPhase;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string | null;
  readonly song: IpodWarRoundSong | null;
  readonly submittedPlayerIds: ReadonlyArray<string>;
  readonly lastResults: IpodWarRoundResults | null;
  readonly mySubmission?: IpodWarSubmissionGuess | null;
}

export type StartGameErrorCode =
  | 'HOST_SPOTIFY_NOT_CONNECTED'
  | 'NOT_ENOUGH_PLAYERS'
  | 'GAME_NOT_CONFIGURED'
  | 'NO_PLAYLIST_SELECTED'
  | 'INSUFFICIENT_SONGS';

export class StartGameError extends Error {
  readonly code: StartGameErrorCode;
  readonly available?: number;
  readonly required?: number;

  constructor(message: string, code: StartGameErrorCode, available?: number, required?: number) {
    super(message);
    this.name = 'StartGameError';
    this.code = code;
    this.available = available;
    this.required = required;
  }
}

export interface SubmitGuessInput {
  readonly playerId: string;
  readonly trackName: string;
  readonly artistName?: string;
  readonly albumName?: string;
}

export interface IpodWarClient {
  readonly fetchPlaylistOptions: (sessionId: string) => Promise<AggregatedPlaylistOption[]>;
  readonly startGame: (sessionId: string) => Promise<void>;
  readonly fetchPlaybackToken: (sessionId: string) => Promise<{ accessToken: string }>;
  readonly submitGuess: (sessionId: string, input: SubmitGuessInput) => Promise<void>;
  readonly fetchHostSnapshot: (sessionId: string) => Promise<IpodWarSnapshot>;
  readonly fetchPlayerSnapshot: (sessionId: string, playerId: string) => Promise<IpodWarSnapshot>;
}
