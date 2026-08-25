import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listPlaylistTracks } from './list-playlist-tracks.js';

vi.mock('@jostle/integrations', () => ({
  getJsonWithBearerToken: vi.fn(),
}));

const { getJsonWithBearerToken } = await import('@jostle/integrations');
const mockedGetJson = vi.mocked(getJsonWithBearerToken);

describe('listPlaylistTracks', () => {
  beforeEach(() => {
    mockedGetJson.mockReset();
  });

  it('filters out local files, removed tracks, and non-track episodes', async () => {
    mockedGetJson.mockResolvedValueOnce({
      next: null,
      items: [
        {
          is_local: false,
          track: {
            id: 'track-1',
            uri: 'spotify:track:track-1',
            name: 'Bohemian Rhapsody',
            type: 'track',
            artists: [{ name: 'Queen' }],
            album: { name: 'A Night at the Opera', images: [{ url: 'https://example.com/cover.jpg' }] },
            duration_ms: 354000,
          },
        },
        { is_local: true, track: { id: 'local-1', uri: 'spotify:local:x', name: 'Local File', type: 'track', artists: [], album: { name: '', images: [] }, duration_ms: 0 } },
        { is_local: false, track: null },
        {
          is_local: false,
          track: {
            id: 'ep-1',
            uri: 'spotify:episode:ep-1',
            name: 'Some Podcast',
            type: 'episode',
            artists: [],
            album: { name: '', images: [] },
            duration_ms: 100,
          },
        },
      ],
    });

    const tracks = await listPlaylistTracks('token', 'playlist-1');

    expect(tracks).toEqual([
      {
        uri: 'spotify:track:track-1',
        id: 'track-1',
        name: 'Bohemian Rhapsody',
        artists: ['Queen'],
        albumName: 'A Night at the Opera',
        albumImageUrl: 'https://example.com/cover.jpg',
        durationMs: 354000,
      },
    ]);
  });

  it('follows pagination via next until exhausted', async () => {
    mockedGetJson
      .mockResolvedValueOnce({
        next: 'https://api.spotify.com/v1/playlists/p/tracks?offset=100',
        items: [
          {
            is_local: false,
            track: {
              id: 'a',
              uri: 'spotify:track:a',
              name: 'Song A',
              type: 'track',
              artists: [{ name: 'Artist A' }],
              album: { name: 'Album A', images: [] },
              duration_ms: 1000,
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        next: null,
        items: [
          {
            is_local: false,
            track: {
              id: 'b',
              uri: 'spotify:track:b',
              name: 'Song B',
              type: 'track',
              artists: [{ name: 'Artist B' }],
              album: { name: 'Album B', images: [] },
              duration_ms: 2000,
            },
          },
        ],
      });

    const tracks = await listPlaylistTracks('token', 'playlist-1');

    expect(mockedGetJson).toHaveBeenCalledTimes(2);
    expect(tracks.map((track) => track.id)).toEqual(['a', 'b']);
  });
});
