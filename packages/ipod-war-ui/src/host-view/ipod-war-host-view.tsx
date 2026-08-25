import type { LobbyClient } from '@jostle/lobby';
import { useSessionRoster } from '@jostle/lobby';
import type { PubSub } from '@jostle/messaging';
import { audio } from '@jostle/assets';
import { Container, Text, useSoundEffect } from '@jostle/ui';
import { useCallback, useEffect, useRef } from 'react';
import { AvatarCluster } from '../avatar-cluster/index.js';
import { CircularCountdownTimer } from '../countdown/index.js';
import { Leaderboard } from '../leaderboard/index.js';
import { usePlaybackEngine } from '../playback-engine/index.js';
import { RoundResultsPanel } from '../round-results-panel/index.js';
import { useIpodWarHostRound } from '../round-state/index.js';
import type { IpodWarClient } from '../client/index.js';

const CLUSTER_RADIUS = 220;
const CLUSTER_SIZE = 520;

export interface IpodWarHostViewProps {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly client: IpodWarClient;
  readonly rosterClient: LobbyClient;
}

export function IpodWarHostView({ pubsub, sessionId, client, rosterClient }: IpodWarHostViewProps) {
  const { players } = useSessionRoster({ pubsub, sessionId, client: rosterClient });
  const roundState = useIpodWarHostRound({ pubsub, sessionId, client });
  const playSubmitSound = useSoundEffect(audio.submit);

  const fetchAccessToken = useCallback(
    () => client.fetchPlaybackToken(sessionId).then((result) => result.accessToken),
    [client, sessionId],
  );
  const playback = usePlaybackEngine({ fetchAccessToken });

  const playedRoundRef = useRef<number>(-1);
  const pausedRoundRef = useRef<number>(-1);
  const submittedCountRef = useRef<number>(0);

  useEffect(() => {
    if (
      roundState.phase === 'playback' &&
      roundState.song &&
      roundState.roundIndex !== playedRoundRef.current
    ) {
      playedRoundRef.current = roundState.roundIndex;
      void playback.playClipAt(roundState.song.trackUri, roundState.clipStartPositionMs ?? 30_000);
    }
  }, [roundState.phase, roundState.roundIndex, roundState.song, roundState.clipStartPositionMs, playback]);

  useEffect(() => {
    if (roundState.phase === 'results' && roundState.roundIndex !== pausedRoundRef.current) {
      pausedRoundRef.current = roundState.roundIndex;
      void playback.pause();
    }
  }, [roundState.phase, roundState.roundIndex, playback]);

  useEffect(() => {
    if (roundState.submittedPlayerIds.length > submittedCountRef.current) {
      playSubmitSound();
    }
    submittedCountRef.current = roundState.submittedPlayerIds.length;
  }, [roundState.submittedPlayerIds.length, playSubmitSound]);

  const clusterPlayers = players.map((player) => ({
    playerId: player.playerId,
    displayName: player.displayName,
    avatarUrl: player.avatarUrl,
    submitted: roundState.submittedPlayerIds.includes(player.playerId),
  }));

  if (roundState.phase === 'idle') {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={3} className="w-full min-h-[60vh]">
        <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
          Getting the game ready…
        </Text>
        {playback.status === 'unsupported' && (
          <Text textColor="content-secondary">
            This browser doesn&apos;t support Spotify playback. Try Chrome or Edge.
          </Text>
        )}
        {playback.status === 'non_premium' && (
          <Text textColor="content-secondary">
            Playing music requires a Spotify Premium account.
          </Text>
        )}
        {playback.status === 'auth_error' && (
          <Text textColor="content-secondary">
            Reconnect Spotify from your profile to continue.
          </Text>
        )}
      </Container>
    );
  }

  if (roundState.phase === 'ended') {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={4} className="w-full min-h-[60vh]">
        <Text fontSize="2xl" fontWeight="bold" textColor="content-primary">
          Game Over!
        </Text>
        {roundState.lastResults && (
          <Leaderboard entries={roundState.lastResults.leaderboard} title="Final Standings" />
        )}
      </Container>
    );
  }

  if (roundState.phase === 'results' && roundState.lastResults) {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={4} className="relative w-full min-h-[60vh]">
        <RoundResultsPanel results={roundState.lastResults} />
        <div className="absolute bottom-6 left-6">
          <CircularCountdownTimer
            key={`${roundState.roundIndex}-results`}
            phaseEndsAt={roundState.phaseEndsAt}
            size={72}
          />
        </div>
      </Container>
    );
  }

  return (
    <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={4} className="w-full min-h-[60vh]">
      <div
        className="relative flex items-center justify-center"
        style={{ width: CLUSTER_SIZE, height: CLUSTER_SIZE }}
      >
        <CircularCountdownTimer
          key={`${roundState.roundIndex}-playback`}
          phaseEndsAt={roundState.phaseEndsAt}
          label={`Round ${roundState.roundIndex + 1} of ${roundState.totalRounds}`}
        />
        <AvatarCluster players={clusterPlayers} radius={CLUSTER_RADIUS} />
      </div>
    </Container>
  );
}
