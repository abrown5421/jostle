import { audio } from '@jostle/assets';
import { sessionRosterTopic, subscribeTopic } from '@jostle/messaging';
import type { PubSub, SessionRosterPlayer } from '@jostle/messaging';
import { useSoundEffect } from '@jostle/ui';
import { useEffect, useReducer } from 'react';
import type { LobbyClient } from './lobby-client.js';
import { INITIAL_ROSTER_STATE, rosterReducer } from './roster-reducer.js';

export interface UseSessionRosterOptions {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly client: LobbyClient;
}

export interface SessionRosterController {
  readonly players: ReadonlyArray<SessionRosterPlayer>;
  readonly kickPlayer: (playerId: string) => Promise<void>;
}

export function useSessionRoster(options: UseSessionRosterOptions): SessionRosterController {
  const { pubsub, sessionId, client } = options;
  const [state, dispatch] = useReducer(rosterReducer, INITIAL_ROSTER_STATE);
  const playJoinSound = useSoundEffect(audio.join);
  const playLeaveSound = useSoundEffect(audio.leave);

  useEffect(() => {
    let cancelled = false;
    client.listPlayers(sessionId).then((players) => {
      if (!cancelled) dispatch({ kind: 'received_snapshot', players });
    });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId]);

  useEffect(
    () =>
      subscribeTopic(pubsub, sessionRosterTopic, { sessionId }, (envelope) => {
        const { kind, player } = envelope.payload;
        if (kind === 'PLAYER_JOINED') {
          dispatch({ kind: 'player_joined', player });
          playJoinSound();
        } else {
          dispatch({ kind: kind === 'PLAYER_LEFT' ? 'player_left' : 'player_kicked', playerId: player.playerId });
          playLeaveSound();
        }
      }),
    [pubsub, sessionId, playJoinSound, playLeaveSound]
  );

  const kickPlayer = async (playerId: string): Promise<void> => {
    await client.removePlayer({ sessionId, playerId });
  };

  return { players: state.players, kickPlayer };
}
