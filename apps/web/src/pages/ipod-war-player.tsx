import { IpodWarPlayerView } from '@jostle/ipod-war-ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ipodWarClient } from '../ipod-war/ipod-war-client.js';
import { pubsub } from '../messaging/pubsub-client.js';

export function IpodWarPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const stored = sessionStorage.getItem(`jostle:player:${sessionId}`);
    if (!stored) {
      navigate('/join', { replace: true });
      return;
    }
    setPlayerId(stored);
  }, [sessionId, navigate]);

  if (!sessionId || !playerId) return null;

  return (
    <IpodWarPlayerView pubsub={pubsub} sessionId={sessionId} playerId={playerId} client={ipodWarClient} />
  );
}
