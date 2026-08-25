import {
  ipodWarRoundPlayerTopic,
  ipodWarRoundResultsTopic,
  sessionStatusTopic,
  subscribeTopic,
} from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useEffect, useState } from 'react';
import type {
  IpodWarClient,
  IpodWarPhase,
  IpodWarRoundResults,
  IpodWarSubmissionGuess,
} from '../client/index.js';

export interface IpodWarPlayerRoundState {
  readonly phase: IpodWarPhase;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly phaseEndsAt: string | null;
  readonly guessFieldsRequired: { readonly artist: boolean; readonly album: boolean };
  readonly lastResults: IpodWarRoundResults | null;
  readonly mySubmission: IpodWarSubmissionGuess | null;
}

const IDLE_STATE: IpodWarPlayerRoundState = {
  phase: 'idle',
  roundIndex: -1,
  totalRounds: 0,
  phaseEndsAt: null,
  guessFieldsRequired: { artist: false, album: false },
  lastResults: null,
  mySubmission: null,
};

export interface UseIpodWarPlayerRoundOptions {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly playerId: string;
  readonly client: IpodWarClient;
}

export function useIpodWarPlayerRound({
  pubsub,
  sessionId,
  playerId,
  client,
}: UseIpodWarPlayerRoundOptions): IpodWarPlayerRoundState {
  const [state, setState] = useState<IpodWarPlayerRoundState>(IDLE_STATE);

  useEffect(() => {
    let cancelled = false;
    client.fetchPlayerSnapshot(sessionId, playerId).then((snapshot) => {
      if (cancelled) return;
      setState((prev) => ({
        phase: snapshot.phase,
        roundIndex: snapshot.roundIndex,
        totalRounds: snapshot.totalRounds,
        phaseEndsAt: snapshot.phaseEndsAt,
        guessFieldsRequired: prev.guessFieldsRequired,
        lastResults: snapshot.lastResults,
        mySubmission: snapshot.mySubmission ?? null,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId, playerId]);

  useEffect(
    () =>
      subscribeTopic(pubsub, ipodWarRoundPlayerTopic, { sessionId }, (envelope) => {
        const payload = envelope.payload;
        setState({
          phase: 'playback',
          roundIndex: payload.roundIndex,
          totalRounds: payload.totalRounds,
          phaseEndsAt: payload.phaseEndsAt,
          guessFieldsRequired: payload.guessFieldsRequired,
          lastResults: null,
          mySubmission: null,
        });
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
