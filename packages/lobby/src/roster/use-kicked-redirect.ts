import { sessionRosterTopic, subscribeTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useEffect } from 'react';

export interface UseKickedRedirectOptions {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly playerId: string;
  readonly onKicked: () => void;
}

export function useKickedRedirect(options: UseKickedRedirectOptions): void {
  const { pubsub, sessionId, playerId, onKicked } = options;

  useEffect(
    () =>
      subscribeTopic(pubsub, sessionRosterTopic, { sessionId }, (envelope) => {
        if (envelope.payload.kind === 'PLAYER_KICKED' && envelope.payload.player.playerId === playerId) {
          onKicked();
        }
      }),
    [pubsub, sessionId, playerId, onKicked]
  );
}
