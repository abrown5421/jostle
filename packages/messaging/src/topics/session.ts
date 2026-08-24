import { defineTopic } from './define-topic.js';

export interface SessionHost {
  readonly nodeId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type SessionScope = 'host' | 'player' | 'spectator';

export type SessionTransactionKind = 'setup' | 'state_sync' | 'input';

export interface SessionTransactionPayload<TData = Readonly<Record<string, unknown>>> {
  readonly kind: SessionTransactionKind;
  readonly tick: number;
  readonly scope: SessionScope;
  readonly host: SessionHost;
  readonly data: TData;
}

export interface SessionTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const sessionTopic = defineTopic<SessionTopicParams, SessionTransactionPayload>('session:{sessionId}');
