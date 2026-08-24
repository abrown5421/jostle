import type { Transport, TransportHandler, Unsubscribe } from '@jostle/messaging';
import { WebSocket, WebSocketServer } from 'ws';

export interface WebSocketServerTransportOptions {
  readonly port: number;
}

interface InboundMessage {
  readonly type: 'subscribe' | 'unsubscribe' | 'publish';
  readonly topic: string;
  readonly payload?: unknown;
}

function parseInboundMessage(raw: unknown): InboundMessage | undefined {
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed && typeof parsed.topic === 'string' && typeof parsed.type === 'string') {
      return parsed as InboundMessage;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function createWebSocketServerTransport(options: WebSocketServerTransportOptions): Transport {
  const wss = new WebSocketServer({ port: options.port });
  const socketsByTopic = new Map<string, Set<WebSocket>>();
  const inboundHandlersByTopic = new Map<string, Set<TransportHandler>>();

  wss.on('connection', (socket) => {
    const subscribedTopics = new Set<string>();

    socket.on('message', (raw) => {
      const message = parseInboundMessage(raw);
      if (!message) return;

      if (message.type === 'subscribe') {
        subscribedTopics.add(message.topic);
        const sockets = socketsByTopic.get(message.topic) ?? new Set<WebSocket>();
        sockets.add(socket);
        socketsByTopic.set(message.topic, sockets);
      } else if (message.type === 'unsubscribe') {
        subscribedTopics.delete(message.topic);
        socketsByTopic.get(message.topic)?.delete(socket);
      } else if (message.type === 'publish') {
        const handlers = inboundHandlersByTopic.get(message.topic);
        for (const handler of handlers ?? []) {
          handler({ topic: message.topic, payload: message.payload });
        }
      }
    });

    socket.on('close', () => {
      for (const topic of subscribedTopics) {
        socketsByTopic.get(topic)?.delete(socket);
      }
    });
  });

  const publish: Transport['publish'] = async (topic, payload) => {
    const sockets = socketsByTopic.get(topic);
    if (!sockets) return;
    const message = JSON.stringify({ type: 'message', topic, payload });
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) socket.send(message);
    }
  };

  const subscribe: Transport['subscribe'] = (topic, handler) => {
    const handlers = inboundHandlersByTopic.get(topic) ?? new Set<TransportHandler>();
    handlers.add(handler);
    inboundHandlersByTopic.set(topic, handlers);

    const unsubscribe: Unsubscribe = () => {
      handlers.delete(handler);
      if (handlers.size === 0) inboundHandlersByTopic.delete(topic);
    };
    return unsubscribe;
  };

  const close: Transport['close'] = () =>
    new Promise((resolve, reject) => {
      wss.close((error) => (error ? reject(error) : resolve()));
    });

  return { publish, subscribe, close };
}
