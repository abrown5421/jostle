import { StartGameError } from '@jostle/ipod-war-ui';
import type {
  AggregatedPlaylistOption,
  IpodWarClient,
  IpodWarSnapshot,
  StartGameErrorCode,
} from '@jostle/ipod-war-ui';

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

export const ipodWarClient: IpodWarClient = {
  async fetchPlaylistOptions(sessionId) {
    const data = (await getJson(`/sessions/${sessionId}/ipod-war/playlist-options`)) as {
      playlists: AggregatedPlaylistOption[];
    };
    return data.playlists;
  },

  async startGame(sessionId) {
    const response = await fetch(`/sessions/${sessionId}/ipod-war/start`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) return;

    const data = (await response.json().catch(() => null)) as
      | { error?: string; code?: StartGameErrorCode; available?: number; required?: number }
      | null;

    if (data?.code) {
      throw new StartGameError(
        data.error ?? 'Could not start the game.',
        data.code,
        data.available,
        data.required,
      );
    }
    throw new Error(data?.error ?? `Could not start the game (status ${response.status}).`);
  },

  async fetchPlaybackToken(sessionId) {
    const data = (await getJson(`/sessions/${sessionId}/ipod-war/playback-token`)) as {
      accessToken: string;
    };
    return data;
  },

  async submitGuess(sessionId, input) {
    const response = await fetch(`/sessions/${sessionId}/ipod-war/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit guess (status ${response.status}).`);
    }
  },

  async fetchHostSnapshot(sessionId) {
    const data = (await getJson(`/sessions/${sessionId}/ipod-war/snapshot?role=host`)) as {
      snapshot: IpodWarSnapshot;
    };
    return data.snapshot;
  },

  async fetchPlayerSnapshot(sessionId, playerId) {
    const data = (await getJson(
      `/sessions/${sessionId}/ipod-war/snapshot?role=player&playerId=${encodeURIComponent(playerId)}`,
    )) as { snapshot: IpodWarSnapshot };
    return data.snapshot;
  },
};
