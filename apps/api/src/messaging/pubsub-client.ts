import { createPubSub } from '@jostle/messaging';
import { createWebSocketServerTransport } from './websocket-transport.js';

const WS_PORT = Number(process.env.WS_PORT) || 3334;

const transport = createWebSocketServerTransport({ port: WS_PORT });

export const pubsub = createPubSub({ transport });

export const closePubSubTransport = (): Promise<void> => transport.close();
