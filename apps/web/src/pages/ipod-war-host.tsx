import { IpodWarHostView } from '@jostle/ipod-war-ui';
import { useParams } from 'react-router';
import { ipodWarClient } from '../ipod-war/ipod-war-client.js';
import { pubsub } from '../messaging/pubsub-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

export function IpodWarHostPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return null;

  return (
    <IpodWarHostView
      pubsub={pubsub}
      sessionId={sessionId}
      client={ipodWarClient}
      rosterClient={sessionsClient}
    />
  );
}
