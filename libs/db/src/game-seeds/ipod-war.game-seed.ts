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
    { title: 'Listen', description: 'A random song from the bank plays on the host screen for the playback time.' },
    {
      title: 'Answer',
      description: 'Type the song title on your device - plus the artist and album when those are turned on.',
    },
    {
      title: 'Score',
      description:
        'Answers are graded for completeness and speed. The difficulty (1-10) decides how forgiving the grading is - low difficulty accepts typos and partial answers, high difficulty wants them exact.',
    },
    { title: 'Win', description: 'After the last song in the bank, the highest score wins.' },
  ],
  settings: [
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
  order: 10,
  seedVersion: 2,
  isPublished: true,
};

export default ipodWarGameSeed;
