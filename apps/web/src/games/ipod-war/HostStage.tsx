import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Button, CountdownBar, Icon, Leaderboard, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { IpodWarHostView, IpodWarPublicView } from '@inithium/game-session';
import type { HostStageProps } from '../registry';
import { participantsById } from '../shared/participants';
import { AUTO_PAUSED_NOTICE, deadlineOf, FinalResults, LockInGrid, StageHeader, StagePanel, toLeaderboardRows } from '../shared/stage';
import { SECONDARY_BUTTON_PROPS, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { activateSpotifyPlayer } from './spotifyPlayer';
import { useIpodWarAudio } from './useIpodWarAudio';

// After this long cueing a song with no word from Spotify, offer Retry/Skip.
const SLOW_LOAD_MS = 8_000;
// Mirrors the server's COUNTDOWN_MS (ipodWar.reducer.ts) - runtime values can't be imported from
// @inithium/game-session in the browser, only its types.
const COUNTDOWN_MS = 5_000;

const SpotifyAttribution = () => (
  <Text as="span" className="inline-flex items-center gap-1 text-xs font-medium" textColor={SURFACE_TEXT}>
    <Icon as="span" name="SpotifyLogo" size={16} weight="fill" />
    Playing on Spotify
  </Text>
);

const useIsSlow = (key: string, active: boolean): boolean => {
  const [isSlow, setIsSlow] = useState(false);
  useEffect(() => {
    setIsSlow(false);
    if (!active) return undefined;
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, [key, active]);
  return isSlow;
};

// The shared screen while iPod War runs: what's playing (never what it *is*, until the reveal),
// who's locked in, the answers and leaderboard, and the host's controls.
export const HostStage = ({ session, publicView, hostView, status, sendAction }: HostStageProps) => {
  const view = publicView as IpodWarPublicView;
  const host = (hostView as IpodWarHostView | null) ?? null;
  const people = participantsById(session.participants);
  const audio = useIpodWarAudio(host, sendAction);
  const isOpen = status === 'open';

  const isLoading = view.phase === 'loading';
  const isSlowToLoad = useIsSlow(`${view.songNumber}:${host?.playback.attempt ?? 0}`, isLoading && !view.paused);
  const playbackError = host?.playback.error ?? null;

  // Resume is also the click a reloaded page needs before it may play audio, and takes the audio
  // for this tab if another had it.
  const resume = () => {
    void activateSpotifyPlayer();
    if (!audio.isOwner && audio.player.deviceId) sendAction({ type: 'claim-audio', payload: { deviceId: audio.player.deviceId } });
    sendAction({ type: 'resume' });
  };
  const retry = () => {
    void activateSpotifyPlayer();
    sendAction({ type: 'retry-playback' });
  };

  const notices: ReactNode[] = [];
  if (audio.player.status === 'unsupported') {
    notices.push("This browser can't play Spotify - host from desktop Chrome, Edge, Firefox or Safari.");
  } else if (audio.player.status === 'error' && audio.player.error) {
    notices.push(audio.player.error.message);
  }
  if (view.paused && view.autoPaused) notices.push(AUTO_PAUSED_NOTICE);
  if (playbackError) notices.push(`Spotify: ${playbackError}`);

  return (
    <Box flex={{ direction: 'col', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <StageHeader
        media={
          view.playlist.imageUrl ? (
            <img src={view.playlist.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <Icon as="span" name="MusicNotes" size={40} />
          )
        }
        title={`iPod War · ${view.playlist.name}`}
        subtitle={
          <>
            {view.phase === 'final' ? `${view.songCount} songs` : `Song ${view.songNumber} of ${view.songCount}`} · Room code{' '}
            <span className="font-mono font-bold tracking-widest">{session.code}</span>
          </>
        }
        extra={<SpotifyAttribution />}
        isFinal={view.phase === 'final'}
        paused={view.paused}
        isOpen={isOpen}
        sendAction={sendAction}
        onResume={resume}
        endDescription="Everyone goes straight to the final results. The song in progress won’t be scored."
      />

      {notices.map((notice, index) => (
        <Alert key={index} severity="warning" closeable={false} duration={0} message={notice} />
      ))}
      {audio.isPlayingElsewhere && view.phase !== 'final' && (
        <Alert
          severity="info"
          closeable={false}
          duration={0}
          message={
            <Box flex={{ direction: 'row', align: 'center', justify: 'between', gap: 12, wrap: 'wrap' }} className="w-full">
              <span>The music is playing on another screen.</span>
              <Button variant={{ kind: 'filled', color: 'primary' }} disabled={audio.player.status !== 'ready'} onClick={audio.playHere}>
                Play here instead
              </Button>
            </Box>
          }
        />
      )}

      {view.phase === 'countdown' && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            Get ready
          </Text>
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            {view.songCount} songs from “{view.playlist.name}”
          </Text>
          <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={COUNTDOWN_MS} now={getGameSessionServerNow} className="max-w-xl" />
        </StagePanel>
      )}

      {(view.phase === 'loading' || view.phase === 'playing') && (
        <StagePanel className="flex-1 items-center justify-center text-center">
          <Icon as="span" name="MusicNotes" size={72} className={view.phase === 'playing' && !view.paused ? 'animate-pulse' : ''} />
          <Text as="h2" className="text-5xl font-black" textColor={SURFACE_TEXT}>
            Song {view.songNumber}
          </Text>
          {view.phase === 'loading' ? (
            <Box flex={{ direction: 'col', align: 'center', gap: 12 }}>
              <Text as="p" textColor={SURFACE_TEXT}>
                {view.paused ? 'Paused' : 'Cueing it up…'}
              </Text>
              {(isSlowToLoad || playbackError) && !view.paused && (
                <Box flex={{ direction: 'row', gap: 8 }}>
                  <Button variant={{ kind: 'filled', color: 'primary' }} disabled={!isOpen} onClick={retry}>
                    Retry
                  </Button>
                  <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={() => sendAction({ type: 'skip' })}>
                    Skip this song
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.playbackMs} now={getGameSessionServerNow} className="max-w-2xl" />
          )}
          <LockInGrid roster={view.roster} lockedIn={view.lockedIn} people={people} />
        </StagePanel>
      )}

      {view.phase === 'reveal' && view.answer && (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StagePanel className="items-center justify-center text-center">
            {view.answer.albumImageUrl && (
              <img src={view.answer.albumImageUrl} alt="" className="aspect-square w-full max-w-xs rounded-lg object-cover shadow-lg" />
            )}
            <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
              {view.answer.title}
            </Text>
            <Text as="p" className="text-2xl font-semibold" textColor={SURFACE_TEXT}>
              {view.answer.artists.join(', ')}
            </Text>
            <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
              {view.answer.album}
            </Text>
            <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.revealMs} now={getGameSessionServerNow} className="max-w-md" />
            <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
              {view.songNumber < view.songCount ? 'Next song coming up' : 'Final results coming up'}
            </Text>
          </StagePanel>
          <StagePanel>
            <Leaderboard title="Leaderboard" rows={toLeaderboardRows(view.standings, people, 32)} />
          </StagePanel>
        </div>
      )}

      {view.phase === 'final' && <FinalResults standings={view.standings} people={people} isOpen={isOpen} sendAction={sendAction} />}
    </Box>
  );
};
