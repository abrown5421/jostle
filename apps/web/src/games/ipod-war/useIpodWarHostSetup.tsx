import { Icon, Text } from '@inithium/ui';
import type { HostSetup } from '../registry';
import { SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { activateSpotifyPlayer } from './spotifyPlayer';
import type { SpotifyPlayerState } from './spotifyPlayer';
import { useSpotifyPlayer } from './useSpotifyPlayer';

const describePlayer = (player: SpotifyPlayerState): string | null => {
  switch (player.status) {
    case 'ready':
      return null;
    case 'unsupported':
      return "Host iPod War from a desktop browser (Chrome, Edge, Firefox or Safari) - Spotify can't play on phones or tablets.";
    case 'error':
      return player.error?.message ?? 'The Spotify player hit a problem - refresh to try again.';
    case 'not-ready':
      return 'The Spotify player went offline - refresh to reconnect it.';
    default:
      return 'Connecting the Spotify player…';
  }
};

// The host's browser is where the music plays, so it must have a working Spotify player before
// the game can start - and the Start click is what unlocks audio on it.
export const useIpodWarHostSetup = (): HostSetup => {
  const player = useSpotifyPlayer();
  const problem = describePlayer(player);
  return {
    startBlocker: problem,
    beforeStart: activateSpotifyPlayer,
    panel: (
      <Text as="p" className="inline-flex items-center justify-center gap-1 text-sm" textColor={SURFACE_TEXT}>
        <Icon as="span" name={problem ? 'SpeakerSlash' : 'SpeakerHigh'} size={16} />
        {problem ? 'Music will play on this screen once Spotify connects.' : 'Spotify is ready - music will play on this screen.'}
      </Text>
    ),
  };
};
