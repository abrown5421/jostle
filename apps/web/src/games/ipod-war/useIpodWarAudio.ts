import { useCallback, useEffect, useRef } from 'react';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { IpodWarHostView } from '@inithium/game-session';
import type { WebGameAction } from '../registry';
import { activateSpotifyPlayer, pauseSpotify, playSpotifyClip } from './spotifyPlayer';
import type { SpotifyPlayerState } from './spotifyPlayer';
import { useSpotifyPlayer } from './useSpotifyPlayer';

export interface IpodWarAudio {
  readonly player: SpotifyPlayerState;
  // This tab's player is the one the game plays through.
  readonly isOwner: boolean;
  // Another host tab (or a previous page load) holds the audio.
  readonly isPlayingElsewhere: boolean;
  // Unlocks audio and makes this tab the one that plays - call from a click.
  readonly playHere: () => void;
}

// How far into the clip the game's clock says we are - where audio should be after a resume.
const expectedClipPosition = (hostView: IpodWarHostView): number => {
  const remaining = hostView.phaseEndsAt
    ? Math.max(0, Date.parse(hostView.phaseEndsAt) - getGameSessionServerNow())
    : (hostView.pausedRemainingMs ?? hostView.playbackMs);
  return (hostView.song?.clipStartMs ?? 0) + Math.max(0, hostView.playbackMs - remaining);
};

// The host screen's half of playback: the server decides what should be playing (hostView), this
// makes this browser's Spotify player do it and reports back - "it started" (which starts the
// clip's clock) or "it failed" (which pauses it). Each (song, attempt) is played once; the server
// bumps `attempt` whenever the clip should be (re)started - a resume, a retry, a new audio device.
export const useIpodWarAudio = (hostView: IpodWarHostView | null, sendAction: (action: WebGameAction) => boolean): IpodWarAudio => {
  const player = useSpotifyPlayer();
  const ownerDeviceId = hostView?.playback.deviceId ?? null;
  const isOwner = player.deviceId !== null && ownerDeviceId === player.deviceId;

  // The first tab whose player is ready takes the audio; any other must ask (playHere).
  useEffect(() => {
    if (player.status === 'ready' && player.deviceId && hostView && ownerDeviceId === null) {
      sendAction({ type: 'claim-audio', payload: { deviceId: player.deviceId } });
    }
  }, [player.status, player.deviceId, hostView, ownerDeviceId, sendAction]);

  const lastPlayed = useRef<string | null>(null);
  const isPausedLocally = useRef(false);

  useEffect(() => {
    if (!hostView || !isOwner) return;
    const { phase, paused, song, songIndex, playback } = hostView;

    if (paused || phase === 'countdown' || phase === 'final') {
      if (!isPausedLocally.current) {
        isPausedLocally.current = true;
        void pauseSpotify();
      }
      return;
    }
    // The song keeps playing through its reveal, so everyone hears what it was.
    if (phase === 'reveal' || !song) return;

    const key = `${songIndex}:${playback.attempt}`;
    if (lastPlayed.current === key) return;
    lastPlayed.current = key;
    isPausedLocally.current = false;

    const report = { index: songIndex, attempt: playback.attempt };
    playSpotifyClip(song.uri, phase === 'playing' ? expectedClipPosition(hostView) : song.clipStartMs)
      .then(() => {
        if (phase === 'loading') sendAction({ type: 'playback-started', payload: report });
      })
      .catch((error: unknown) =>
        sendAction({
          type: 'playback-failed',
          payload: { ...report, message: error instanceof Error ? error.message : 'Playback failed' },
        }),
      );
  }, [hostView, isOwner, sendAction]);

  const playHere = useCallback(() => {
    void activateSpotifyPlayer();
    if (player.deviceId) sendAction({ type: 'claim-audio', payload: { deviceId: player.deviceId } });
  }, [player.deviceId, sendAction]);

  return { player, isOwner, isPlayingElsewhere: ownerDeviceId !== null && !isOwner, playHere };
};
