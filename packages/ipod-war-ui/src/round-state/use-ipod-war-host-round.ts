import {
  ipodWarRoundHostTopic,
  ipodWarRoundResultsTopic,
  ipodWarSubmissionTopic,
  sessionStatusTopic,
  subscribeTopic,
} from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useEffect, useState } from 'react';
import type { IpodWarClient, IpodWarPhase, IpodWarRoundResults, IpodWarRoundSong } from '../client/index.js';

export interface IpodWarHostRoundState {
  readonly phase: IpodWarPhase;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string | null;
  readonly song: IpodWarRoundSong | null;
  readonly clipStartPositionMs: number | null;
  readonly submittedPlayerIds: ReadonlyArray<string>;
  readonly lastResults: IpodWarRoundResults | null;
}

const IDLE_STATE: IpodWarHostRoundState = {
  phase: 'idle',
  roundIndex: -1,
  totalRounds: 0,
  phaseEndsAt: null,
  song: null,
  clipStartPositionMs: null,
  submittedPlayerIds: [],
  lastResults: null,
};

export interface UseIpodWarHostRoundOptions {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly client: IpodWarClient;
}

export function useIpodWarHostRound({
  pubsub,
  sessionId,
  client,
}: UseIpodWarHostRoundOptions): IpodWarHostRoundState {
  const [state, setState] = useState<IpodWarHostRoundState>(IDLE_STATE);

  useEffect(() => {
    let cancelled = false;
    client.fetchHostSnapshot(sessionId).then((snapshot) => {
      if (cancelled) return;
      setState({
        phase: snapshot.phase,
        roundIndex: snapshot.roundIndex,
        totalRounds: snapshot.totalRounds,
        phaseEndsAt: snapshot.phaseEndsAt,
        song: snapshot.song,
        clipStartPositionMs: null,
        submittedPlayerIds: snapshot.submittedPlayerIds,
        lastResults: snapshot.lastResults,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId]);

  useEffect(
    () =>
      subscribeTopic(pubsub, ipodWarRoundHostTopic, { sessionId }, (envelope) => {
        const payload = envelope.payload;
        setState({
          phase: 'playback',
          roundIndex: payload.roundIndex,
          totalRounds: payload.totalRounds,
          phaseEndsAt: payload.phaseEndsAt,
          song: payload.song,
          clipStartPositionMs: payload.clipStartPositionMs,
          submittedPlayerIds: [],
          lastResults: null,
        });
      }),
    [pubsub, sessionId],
  );

  useEffect(
    () =>
      subscribeTopic(pubsub, ipodWarSubmissionTopic, { sessionId }, (envelope) => {
        const payload = envelope.payload;
        setState((prev) =>
          prev.roundIndex === payload.roundIndex
            ? {
                ...prev,
                submittedPlayerIds: Array.from(
                  new Set([...prev.submittedPlayerIds, payload.playerId]),
                ),
              }
            : prev,
        );
      }),
    [pubsub, sessionId],
  );

  useEffect(
    () =>
      subscribeTopic(pubsub, ipodWarRoundResultsTopic, { sessionId }, (envelope) => {
        setState((prev) => ({
          ...prev,
          phase: 'results',
          phaseEndsAt: envelope.payload.phaseEndsAt,
          lastResults: envelope.payload,
        }));
      }),
    [pubsub, sessionId],
  );

  useEffect(
    () =>
      subscribeTopic(pubsub, sessionStatusTopic, { sessionId }, (envelope) => {
        if (envelope.payload.status === 'ended') {
          setState((prev) => ({ ...prev, phase: 'ended', phaseEndsAt: null }));
        }
      }),
    [pubsub, sessionId],
  );

  return state;
}
