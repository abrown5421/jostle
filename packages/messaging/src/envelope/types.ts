export interface MessageEnvelope<TPayload = unknown> {
  readonly id: string;
  readonly topic: string;
  readonly timestamp: number;
  readonly payload: TPayload;
  readonly meta: Readonly<Record<string, unknown>>;
}
