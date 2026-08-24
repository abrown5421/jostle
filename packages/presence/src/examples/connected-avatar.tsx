import type { PubSub } from '@jostle/messaging';
import { Avatar } from '../avatar/index.js';
import { usePresenceStatus } from '../presence-stream/index.js';

export interface ConnectedAvatarProps {
  readonly pubsub: PubSub;
  readonly entityId: string;
  readonly name: string;
  readonly imageUrl?: string;
}

export function ConnectedAvatar({ pubsub, entityId, name, imageUrl }: ConnectedAvatarProps) {
  const status = usePresenceStatus({ pubsub, entityId });
  return <Avatar name={name} imageUrl={imageUrl} status={status} />;
}
