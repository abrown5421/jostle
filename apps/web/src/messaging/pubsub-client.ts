import { createInMemoryTransport, createPubSub } from '@jostle/messaging';

export const pubsub = createPubSub({ transport: createInMemoryTransport() });
