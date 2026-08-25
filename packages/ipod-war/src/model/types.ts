import type { IpodWarHostRoundSong, IpodWarRoundResultsPayload } from '@jostle/messaging';
import type { ObjectId } from 'mongodb';

export const SPOTIFY_PROVIDER_ID = 'SPOTIFY';

export type IpodWarPhase = 'idle' | 'playback' | 'results' | 'ended';

export interface IpodWarConfig {
  readonly songCount: number;
  readonly clipDurationSeconds: number;
  readonly guessArtist: boolean;
  readonly guessAlbum: boolean;
  readonly difficulty: number;
  readonly selectedPlaylistId: string;
}

export interface IpodWarSongBankEntry {
  readonly trackUri: string;
  readonly trackId: string;
  readonly trackName: string;
  readonly artistNames: ReadonlyArray<string>;
  readonly albumName: string;
  readonly albumImageUrl: string | null;
  readonly durationMs: number;
  readonly contributedByUserId: string;
  readonly contributedByPlayerId?: string;
}

export interface IpodWarRoundRecord {
  readonly roundIndex: number;
  readonly song: IpodWarSongBankEntry;
  readonly startedAt: Date;
  readonly phaseEndsAt: Date;
  readonly resultsComputedAt?: Date;
}

export interface IpodWarStateDocument {
  readonly _id: ObjectId;
  readonly sessionId: ObjectId;
  readonly config: IpodWarConfig;
  readonly songBank: ReadonlyArray<IpodWarSongBankEntry>;
  readonly phase: IpodWarPhase;
  readonly currentRoundIndex: number;
  readonly rounds: ReadonlyArray<IpodWarRoundRecord>;
  readonly phaseEndsAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IpodWarSubmissionGuess {
  readonly trackName: string;
  readonly artistName?: string;
  readonly albumName?: string;
}

export interface IpodWarCorrectnessBreakdown {
  readonly trackNameScore: number;
  readonly artistScore?: number;
  readonly albumScore?: number;
  readonly speedMultiplier: number;
}

export interface IpodWarSubmissionDocument {
  readonly _id: ObjectId;
  readonly sessionId: ObjectId;
  readonly roundIndex: number;
  readonly playerId: ObjectId;
  readonly guessTrackName: string;
  readonly guessArtistName?: string;
  readonly guessAlbumName?: string;
  readonly submittedAt: Date;
  readonly submittedAtMsIntoRound: number;
  readonly scored: boolean;
  readonly pointsAwarded?: number;
  readonly correctnessBreakdown?: IpodWarCorrectnessBreakdown;
}

export interface PublicIpodWarState {
  readonly sessionId: string;
  readonly phase: IpodWarPhase;
  readonly currentRoundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string | null;
}

export interface AggregatedPlaylistOption {
  readonly playlistId: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly trackCount: number;
  readonly contributedByUserId: string;
  readonly contributedByPlayerId?: string;
  readonly contributedByDisplayName: string;
}

export type IpodWarRole = 'host' | 'player';

export interface IpodWarSnapshot {
  readonly phase: IpodWarPhase;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string | null;
  readonly song: IpodWarHostRoundSong | null;
  readonly submittedPlayerIds: ReadonlyArray<string>;
  readonly lastResults: IpodWarRoundResultsPayload | null;
  readonly mySubmission?: IpodWarSubmissionGuess | null;
}
