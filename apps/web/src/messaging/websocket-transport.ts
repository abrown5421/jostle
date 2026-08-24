import type { Transport, TransportHandler, Unsubscribe } from '@jostle/messaging';

interface OutboundMessage {
  readonly type: 'subscribe' | 'unsubscribe' | 'publish';
  readonly topic: string;
  readonly payload?: unknown;
}

interface InboundMessage {
  readonly type: 'message';
  readonly topic: string;
  readonly payload: unknown;
}

const RECONNECT_DELAY_MS = 1000;

export function createWebSocketClientTransport(url: string): Transport {
  const handlersByTopic = new Map<string, Set<TransportHandler>>();
  const pendingOutbound: OutboundMessage[] = [];
  let socket: WebSocket | undefined;
  let closed = false;

  function send(message: OutboundMessage): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      pendingOutbound.push(message);
    }
  }

  function connect(): void {
    if (closed) return;
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      for (const topic of handlersByTopic.keys()) send({ type: 'subscribe', topic });
      for (const message of pendingOutbound.splice(0)) send(message);
    });

    socket.addEventListener('message', (event) => {
      let message: InboundMessage;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type !== 'message') return;
      const handlers = handlersByTopic.get(message.topic);
      for (const handler of handlers ?? []) handler({ topic: message.topic, payload: message.payload });
    });

    socket.addEventListener('close', () => {
      if (!closed) setTimeout(connect, RECONNECT_DELAY_MS);
    });
  }
  connect();

  const publish: Transport['publish'] = async (topic, payload) => {
    send({ type: 'publish', topic, payload });
  };

  const subscribe: Transport['subscribe'] = (topic, handler) => {
    const handlers = handlersByTopic.get(topic) ?? new Set<TransportHandler>();
    const isFirstForTopic = handlers.size === 0;
    handlers.add(handler);
    handlersByTopic.set(topic, handlers);
    if (isFirstForTopic) send({ type: 'subscribe', topic });

    const unsubscribe: Unsubscribe = () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        handlersByTopic.delete(topic);
        send({ type: 'unsubscribe', topic });
      }
    };
    return unsubscribe;
  };

  const close: Transport['close'] = async () => {
    closed = true;
    socket?.close();
  };

  return { publish, subscribe, close };
}
