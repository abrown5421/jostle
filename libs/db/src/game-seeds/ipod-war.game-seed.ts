import type { CreateGameInput } from '../contracts/game.contract';

const ipodWarGameSeed: CreateGameInput = {
  slug: 'ipod-war',
  title: 'iPod War',
  tagline: 'Name that tune from the host’s own Spotify playlist.',
  description:
    'The host picks one of their Spotify playlists and a random bank of songs is drawn from it. Each song plays on the host screen while everyone races to type the title - and, if enabled, the artist and album - on their own device. The fastest, most complete answers score the most.',
  imageUrl: '/games/ipod-war-logo.png',
  icon: 'MusicNotes',
  minPlayers: 2,
  maxPlayers: 20,
  estimatedMinutes: 30,
  tags: ['music', 'trivia', 'speed'],
  rules: [
    {
      title: 'Listen',
      description: 'A random clip of a song from the bank plays on the host screen for the playback time.',
    },
    {
      title: 'Answer',
      description:
        'Type the song title on your device - plus the artist and album when those are turned on - then lock in. You only get one shot per song.',
    },
    {
      title: 'Score',
      description:
        'Every correct answer is worth 100 points, plus up to 50 more the faster you locked in. The difficulty (1-10) decides how forgiving the grading is - low difficulty accepts typos, 10 wants them exact.',
    },
    {
      title: 'Reveal',
      description: 'When the clip ends the answers and the leaderboard are revealed, then the next song starts.',
    },
    { title: 'Win', description: 'After the last song in the bank, the highest score wins.' },
  ],
  settings: [
    {
      key: 'playlistId',
      label: 'Playlist',
      description: 'One of your Spotify playlists with at least as many songs as the bank needs.',
      type: 'integration-resource',
      default: '',
      provider: 'spotify',
      resource: 'playlist',
      required: true,
      minItemsFromSetting: 'songCount',
    },
    { key: 'songCount', label: 'Songs', type: 'number', default: 60, min: 30, max: 180, step: 1, unit: 'songs' },
    {
      key: 'playbackSeconds',
      label: 'Playback time',
      description: 'How long each song plays.',
      type: 'number',
      default: 60,
      min: 30,
      max: 180,
      step: 5,
      unit: 'seconds',
    },
    {
      key: 'endWhenAllAnswered',
      label: 'End early when everyone’s in',
      description: 'Skip to the reveal as soon as every player has locked in, instead of playing out the clip.',
      type: 'boolean',
      default: true,
    },
    {
      key: 'revealSeconds',
      label: 'Reveal time',
      description: 'How long the answers and leaderboard show before the next song.',
      type: 'number',
      default: 10,
      min: 5,
      max: 30,
      step: 1,
      unit: 'seconds',
    },
    { key: 'nameArtist', label: 'Name the artist', type: 'boolean', default: true },
    { key: 'nameAlbum', label: 'Name the album', type: 'boolean', default: false },
    {
      key: 'difficulty',
      label: 'Difficulty',
      description: 'How strictly answers are graded - 1 is forgiving, 10 is exact.',
      type: 'number',
      default: 5,
      min: 1,
      max: 10,
      step: 1,
    },
  ],
  // Songs come from the host's playlists and play through the Spotify Web Playback SDK on the host
  // screen, which only works for Premium accounts.
  requirements: [{ kind: 'integration', provider: 'spotify', capabilities: ['playlists', 'playback'] }],
  order: 10,
  seedVersion: 3,
  isPublished: true,
};

export default ipodWarGameSeed;
