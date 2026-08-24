import { DisplayNameTakenError, SessionNotFoundError } from '@jostle/lobby';
import type { HostedSession, LobbyClient, SessionConfigurationShape } from '@jostle/lobby';
import type { SessionRosterPlayer } from '@jostle/messaging';

interface SessionResponse {
  readonly session: {
    readonly sessionId: string;
    readonly joinCode: string;
  };
}

interface SessionConfigurationResponse {
  readonly configuration: SessionConfigurationShape | null;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
}

async function putJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

export const sessionsClient: LobbyClient = {
  async createSession() {
    const response = await postJson('/sessions', {});
    if (!response.ok) throw new Error(`Request to /sessions failed with status ${response.status}`);
    const data = (await response.json()) as SessionResponse;
    return data.session;
  },

  async getSessionById(sessionId): Promise<HostedSession | null> {
    const response = await fetch(`/sessions/${sessionId}`, { credentials: 'include' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Request to /sessions/${sessionId} failed with status ${response.status}`);
    const data = (await response.json()) as SessionResponse;
    return data.session;
  },

  async joinSession({ joinCode, displayName, avatarUrl }) {
    const byCodeResponse = await fetch(`/sessions/by-code/${encodeURIComponent(joinCode)}`, { credentials: 'include' });
    if (byCodeResponse.status === 404) throw new SessionNotFoundError();
    if (!byCodeResponse.ok) throw new Error(`Request to resolve join code failed with status ${byCodeResponse.status}`);

    const { session } = (await byCodeResponse.json()) as SessionResponse;

    const joinResponse = await postJson(`/sessions/${session.sessionId}/players`, { displayName, avatarUrl });
    if (joinResponse.status === 409) throw new DisplayNameTakenError();
    if (!joinResponse.ok) throw new Error(`Request to join session failed with status ${joinResponse.status}`);

    const { player } = (await joinResponse.json()) as { player: { playerId: string } };
    return { sessionId: session.sessionId, playerId: player.playerId };
  },

  async listPlayers(sessionId) {
    const data = (await getJson(`/sessions/${sessionId}/players`)) as { players: SessionRosterPlayer[] };
    return data.players;
  },

  async removePlayer({ sessionId, playerId }) {
    const response = await fetch(`/sessions/${sessionId}/players/${playerId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Request to remove player failed with status ${response.status}`);
  },

  async setSessionConfiguration({ sessionId, gameId, selectedSettings }) {
    const data = (await putJson(`/sessions/${sessionId}/configuration`, { gameId, selectedSettings })) as SessionConfigurationResponse;
    if (!data.configuration) throw new Error('Configuration was not returned.');
    return data.configuration;
  },

  async getSessionConfiguration(sessionId) {
    const data = (await getJson(`/sessions/${sessionId}/configuration`)) as SessionConfigurationResponse;
    return data.configuration;
  },
};
