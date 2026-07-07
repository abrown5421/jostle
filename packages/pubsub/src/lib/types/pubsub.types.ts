export type ChannelEventPayload = unknown;

export interface ChannelMessage<T = ChannelEventPayload> {
  readonly channel: string;
  readonly event: string;
  readonly payload: T;
}

export type ChannelMessageHandler = (message: ChannelMessage) => void;

export interface PubSubAdapter {
  readonly publish: (message: ChannelMessage) => Promise<void>;
  readonly subscribe: (channel: string, handler: ChannelMessageHandler) => Promise<void>;
  readonly unsubscribe: (channel: string, handler: ChannelMessageHandler) => Promise<void>;
  readonly dispose?: () => Promise<void>;
}