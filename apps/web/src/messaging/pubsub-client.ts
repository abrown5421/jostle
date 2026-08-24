import { createPubSub } from '@jostle/messaging';
import { createWebSocketClientTransport } from './websocket-transport.js';

export const pubsub = createPubSub({ transport: createWebSocketClientTransport('ws://localhost:3334') });
