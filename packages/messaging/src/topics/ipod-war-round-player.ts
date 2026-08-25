import { defineTopic } from './define-topic.js';

export interface IpodWarRoundPlayerPayload {
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string;
  readonly guessFieldsRequired: {
    readonly artist: boolean;
    readonly album: boolean;
  };
}

export interface IpodWarRoundPlayerTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const ipodWarRoundPlayerTopic = defineTopic<IpodWarRoundPlayerTopicParams, IpodWarRoundPlayerPayload>(
  'session:{sessionId}:ipod-war:round:player'
);
