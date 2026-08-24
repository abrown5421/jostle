export type Unsubscribe = () => void;

export interface TransportMessage {
  readonly topic: string;
  readonly payload: unknown;
}

export type TransportHandler = (message: TransportMessage) => void | Promise<void>;

export interface Transport {
  readonly publish: (topic: string, payload: unknown) => Promise<void>;
  readonly subscribe: (topic: string, handler: TransportHandler) => Unsubscribe;
  readonly close: () => Promise<void>;
}

export type TransportFactory<TOptions = void> = (options: TOptions) => Transport;
