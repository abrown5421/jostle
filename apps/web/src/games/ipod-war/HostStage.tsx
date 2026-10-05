import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Avatar, Box, Button, CountdownBar, Icon, Leaderboard, Podium, Text, dialog } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { SessionParticipant } from '@inithium/api-client';
import type { IpodWarHostView, IpodWarPublicView, IpodWarStanding } from '@inithium/game-session';
import type { HostStageProps } from '../registry';
import { participantsById, resolveParticipantAvatarProps } from '../shared/participants';
import { GHOST_BUTTON_PROPS, SECONDARY_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { activateSpotifyPlayer } from './spotifyPlayer';
import { useIpodWarAudio } from './useIpodWarAudio';

// After this long cueing a song with no word from Spotify, offer Retry/Skip.
const SLOW_LOAD_MS = 8_000;
// Mirrors the server's COUNTDOWN_MS (ipodWar.reducer.ts) - runtime values can't be imported from
// @inithium/game-session in the browser, only its types.
const COUNTDOWN_MS = 5_000;

const deadlineOf = (view: { phaseEndsAt: string | null }): number | null => (view.phaseEndsAt ? Date.parse(view.phaseEndsAt) : null);

const toLeaderboardRows = (standings: readonly IpodWarStanding[], people: Map<string, SessionParticipant>, avatarSize: number) =>
  standings.map((standing) => {
    const participant = people.get(standing.participantId);
    const name = participant?.name ?? 'Former player';
    return {
      id: standing.participantId,
      name,
      score: standing.total,
      rank: standing.rank,
      delta: standing.delta,
      leading: <Avatar {...resolveParticipantAvatarProps({ name, avatar: participant?.avatar ?? null })} size={avatarSize} />,
    };
  });

const SpotifyAttribution = () => (
  <Text as="span" className="inline-flex items-center gap-1 text-xs font-medium" textColor={SURFACE_TEXT}>
    <Icon as="span" name="SpotifyLogo" size={16} weight="fill" />
    Playing on Spotify
  </Text>
);

const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Box flex={{ direction: 'col', gap: 16 }} padding={{ base: 24 }} bgColor={SURFACE_BG} borderColor={SURFACE_BORDER} className={`rounded-xl ${className ?? ''}`}>
    {children}
  </Box>
);

// Who has locked in this song - names only, never what they answered.
const LockInGrid = ({ view, people }: { view: IpodWarPublicView; people: Map<string, SessionParticipant> }) => (
  <ul className="flex flex-wrap justify-center gap-4">
    {view.roster.map((participantId) => {
      const participant = people.get(participantId);
      const isIn = view.lockedIn.includes(participantId);
      const name = participant?.name ?? 'Player';
      return (
        <li key={participantId} className={`flex w-20 flex-col items-center gap-1 transition-opacity ${isIn ? '' : 'opacity-40'}`}>
          <Avatar {...resolveParticipantAvatarProps({ name, avatar: participant?.avatar ?? null })} size={56} status={participant?.isConnected ? 'online' : 'offline'} />
          <Text as="span" className="w-full truncate text-center text-sm font-medium" textColor={SURFACE_TEXT}>
            {name}
          </Text>
          {isIn && <Icon as="span" name="CheckCircle" size={18} weight="fill" className="text-green-600" />}
        </li>
      );
    })}
  </ul>
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
  const send = (type: string) => () => sendAction({ type });

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
  const endGame = async () => {
    const confirmed = await dialog.confirm({
      title: 'End the game?',
      description: 'Everyone goes straight to the final results. The song in progress won’t be scored.',
      confirmLabel: 'End game',
      cancelLabel: 'Keep playing',
      confirmVariant: { kind: 'filled', color: 'red' },
    });
    if (confirmed) sendAction({ type: 'end' });
  };

  const notices: ReactNode[] = [];
  if (audio.player.status === 'unsupported') {
    notices.push("This browser can't play Spotify - host from desktop Chrome, Edge, Firefox or Safari.");
  } else if (audio.player.status === 'error' && audio.player.error) {
    notices.push(audio.player.error.message);
  }
  if (view.paused && view.autoPaused) notices.push('Paused because this screen lost its connection. Press Resume when you’re ready.');
  if (playbackError) notices.push(`Spotify: ${playbackError}`);

  return (
    <Box flex={{ direction: 'col', gap: 24 }} padding={{ base: 24 }} className="w-full flex-1">
      <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 16, wrap: 'wrap' }}>
        <Box flex={{ direction: 'row', align: 'center', gap: 12 }}>
          {view.playlist.imageUrl ? (
            <img src={view.playlist.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <Icon as="span" name="MusicNotes" size={40} />
          )}
          <Box flex={{ direction: 'col' }}>
            <Text as="h1" className="text-xl font-bold" textColor={SURFACE_TEXT}>
              iPod War · {view.playlist.name}
            </Text>
            <Text as="span" className="text-sm" textColor={SURFACE_TEXT}>
              {view.phase === 'final' ? `${view.songCount} songs` : `Song ${view.songNumber} of ${view.songCount}`} · Room code{' '}
              <span className="font-mono font-bold tracking-widest">{session.code}</span>
            </Text>
          </Box>
        </Box>
        <Box flex={{ direction: 'row', align: 'center', gap: 8, wrap: 'wrap' }}>
          <SpotifyAttribution />
          {view.phase !== 'final' && (
            <>
              {view.paused ? (
                <Button variant={{ kind: 'filled', color: 'primary' }} disabled={!isOpen} onClick={resume} entryAdornment={<Icon as="span" name="Play" size={16} weight="fill" />}>
                  Resume
                </Button>
              ) : (
                <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={send('pause')} entryAdornment={<Icon as="span" name="Pause" size={16} weight="fill" />}>
                  Pause
                </Button>
              )}
              <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={send('skip')} entryAdornment={<Icon as="span" name="SkipForward" size={16} weight="fill" />}>
                Skip
              </Button>
              <Button {...GHOST_BUTTON_PROPS} disabled={!isOpen} onClick={() => void endGame()}>
                End game
              </Button>
            </>
          )}
        </Box>
      </Box>

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
        <Panel className="flex-1 items-center justify-center text-center">
          <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
            Get ready
          </Text>
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            {view.songCount} songs from “{view.playlist.name}”
          </Text>
          <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={COUNTDOWN_MS} now={getGameSessionServerNow} className="max-w-xl" />
        </Panel>
      )}

      {(view.phase === 'loading' || view.phase === 'playing') && (
        <Panel className="flex-1 items-center justify-center text-center">
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
                  <Button {...SECONDARY_BUTTON_PROPS} disabled={!isOpen} onClick={send('skip')}>
                    Skip this song
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={view.playbackMs} now={getGameSessionServerNow} className="max-w-2xl" />
          )}
          <Text as="p" className="text-sm font-medium" textColor={SURFACE_TEXT}>
            {view.lockedIn.length} of {view.roster.length} locked in
          </Text>
          <LockInGrid view={view} people={people} />
        </Panel>
      )}

      {view.phase === 'reveal' && view.answer && (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel className="items-center justify-center text-center">
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
          </Panel>
          <Panel>
            <Leaderboard title="Leaderboard" rows={toLeaderboardRows(view.standings, people, 32)} />
          </Panel>
        </div>
      )}

      {view.phase === 'final' && (
        <Panel className="flex-1 items-center">
          <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
            Final results
          </Text>
          <Podium entries={toLeaderboardRows(view.standings.slice(0, 3), people, 64)} />
          <Leaderboard rows={toLeaderboardRows(view.standings, people, 32).map((row) => ({ ...row, delta: undefined }))} className="max-w-xl" />
          <Button variant={{ kind: 'filled', color: 'primary' }} className="text-lg" disabled={!isOpen} onClick={send('back-to-lobby')}>
            Back to the lobby
          </Button>
        </Panel>
      )}
    </Box>
  );
};
