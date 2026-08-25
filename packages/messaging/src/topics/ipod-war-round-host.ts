import { defineTopic } from './define-topic.js';

export interface IpodWarHostRoundSong {
  readonly trackUri: string;
  readonly trackId: string;
  readonly trackName: string;
  readonly artistNames: ReadonlyArray<string>;
  readonly albumName: string;
  readonly albumImageUrl: string | null;
  readonly durationMs: number;
}

export interface IpodWarRoundHostPayload {
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string;
  readonly clipStartPositionMs: number;
  readonly song: IpodWarHostRoundSong;
}

export interface IpodWarRoundHostTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const ipodWarRoundHostTopic = defineTopic<IpodWarRoundHostTopicParams, IpodWarRoundHostPayload>(
  'session:{sessionId}:ipod-war:round:host'
);
