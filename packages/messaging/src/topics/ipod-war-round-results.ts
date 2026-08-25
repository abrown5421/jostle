import { defineTopic } from './define-topic.js';

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

export interface IpodWarRoundResultsPayload {
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly isFinalRound: boolean;
  readonly correctAnswer: IpodWarRoundAnswer;
  readonly perPlayerResults: ReadonlyArray<IpodWarPlayerResult>;
  readonly leaderboard: ReadonlyArray<IpodWarLeaderboardEntry>;
  readonly phaseEndsAt: string;
}

export interface IpodWarRoundResultsTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const ipodWarRoundResultsTopic = defineTopic<
  IpodWarRoundResultsTopicParams,
  IpodWarRoundResultsPayload
>('session:{sessionId}:ipod-war:round:results');
