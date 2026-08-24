export interface TopicDefinition<TParams extends Record<string, string>, TPayload> {
  readonly pattern: string;
  readonly channel: (params: TParams) => string;
  readonly match: (channel: string) => TParams | undefined;
}
