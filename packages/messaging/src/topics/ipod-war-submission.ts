import { defineTopic } from './define-topic.js';

export interface IpodWarSubmissionEventPayload {
  readonly roundIndex: number;
  readonly playerId: string;
  readonly submittedAt: string;
  readonly submittedCount: number;
  readonly totalPlayers: number;
}

export interface IpodWarSubmissionTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const ipodWarSubmissionTopic = defineTopic<IpodWarSubmissionTopicParams, IpodWarSubmissionEventPayload>(
  'session:{sessionId}:ipod-war:round:submissions'
);
