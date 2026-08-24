import type { Transport, TransportHandler, Unsubscribe } from '../transport/index.js';

export function createInMemoryTransport(): Transport {
  const handlersByTopic = new Map<string, Set<TransportHandler>>();

  const publish: Transport['publish'] = async (topic, payload) => {
    const handlers = handlersByTopic.get(topic);
    if (!handlers) return;
    await Promise.all([...handlers].map((handler) => handler({ topic, payload })));
  };

  const subscribe: Transport['subscribe'] = (topic, handler) => {
    const handlers = handlersByTopic.get(topic) ?? new Set<TransportHandler>();
    handlers.add(handler);
    handlersByTopic.set(topic, handlers);

    const unsubscribe: Unsubscribe = () => {
      handlers.delete(handler);
      if (handlers.size === 0) handlersByTopic.delete(topic);
    };
    return unsubscribe;
  };

  const close: Transport['close'] = async () => {
    handlersByTopic.clear();
  };

  return { publish, subscribe, close };
}
