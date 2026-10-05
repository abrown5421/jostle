import type { IncomingMessage, Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { subscribeToChannel } from '@inithium/realtime';
import type { SessionCredential } from '../contracts/session.contract';
import { SESSION_EVENTS, sessionChannel, sessionHostChannel, sessionParticipantChannel } from '../service/channels';
import { isGameSessionError } from '../service/session.errors';
import {
  clearGameSelection,
  dispatchGameAction,
  endSessionAsHost,
  getSessionSnapshot,
  kickParticipant,
  leaveSession,
  resolveSessionCredential,
  selectGame,
  setCredentialConnected,
  startGame,
  updateGameSettings,
} from '../service/session.service';
import { GAME_SESSION_CLOSE_CODES, GAME_SESSION_SOCKET_PATH } from './protocol';
import type { SessionClientMessage, SessionServerMessage } from './protocol';

const HEARTBEAT_INTERVAL_MS = 30000;

type TrackedSocket = WebSocket & { isAlive?: boolean };

const send = (socket: WebSocket, message: SessionServerMessage): void => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
};

// Live socket count per credential, so a player (or host) with two tabs open only flips to
// disconnected when the last one closes - same idea as @inithium/realtime's connectionRegistry.
const socketCountByCredential = new Map<string, number>();
const credentialKey = (credential: SessionCredential): string => `${credential.code}:${credential.participantId ?? 'host'}`;

const adjustSocketCount = (credential: SessionCredential, delta: 1 | -1): number => {
  const key = credentialKey(credential);
  const next = (socketCountByCredential.get(key) ?? 0) + delta;
  if (next <= 0) socketCountByCredential.delete(key);
  else socketCountByCredential.set(key, next);
  return Math.max(next, 0);
};

class UnknownMessageError extends Error {}

const handleClientMessage = async (credential: SessionCredential, message: SessionClientMessage): Promise<void> => {
  switch (message.type) {
    case 'leave':
      return leaveSession(credential);
    case 'host:kick':
      return kickParticipant(credential, message.participantId);
    case 'host:end':
      return endSessionAsHost(credential);
    case 'host:select-game':
      return selectGame(credential, message.gameId);
    case 'host:update-game-settings':
      return updateGameSettings(credential, message.settings);
    case 'host:clear-game':
      return clearGameSelection(credential);
    case 'host:start-game':
      return startGame(credential);
    case 'game:action':
      return dispatchGameAction(credential, message.action);
    default:
      throw new UnknownMessageError();
  }
};

const bindConnection = async (socket: WebSocket, credential: SessionCredential): Promise<void> => {
  const session = await getSessionSnapshot(credential.code);
  if (!session) {
    socket.close(GAME_SESSION_CLOSE_CODES.sessionEnded, 'Session ended');
    return;
  }
  // The client may have gone away during the await above - nothing to bind to.
  if (socket.readyState !== WebSocket.OPEN) return;

  const unsubscribers: Array<() => void> = [];
  const forward = (channel: string) =>
    unsubscribers.push(
      subscribeToChannel(channel, ({ event, payload }) => {
        send(socket, { type: 'event', event, payload });
        if (event === SESSION_EVENTS.ended) socket.close(GAME_SESSION_CLOSE_CODES.sessionEnded, 'Session ended');
        if (event === SESSION_EVENTS.participantRemoved) socket.close(GAME_SESSION_CLOSE_CODES.removed, 'Removed from session');
      }),
    );

  forward(sessionChannel(credential.code));
  forward(
    credential.role === 'host'
      ? sessionHostChannel(credential.code)
      : sessionParticipantChannel(credential.code, credential.participantId ?? ''),
  );

  // Everything below is attached synchronously, before the one await at the end, so a close
  // that lands mid-setup still runs its cleanup.
  socket.on('close', () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    if (adjustSocketCount(credential, -1) === 0) void setCredentialConnected(credential, false);
  });

  socket.on('message', (raw) => {
    let message: SessionClientMessage;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: 'error', code: 'MALFORMED_MESSAGE', message: 'Malformed message: expected JSON' });
      return;
    }
    handleClientMessage(credential, message).catch((error: unknown) => {
      if (isGameSessionError(error)) {
        send(socket, { type: 'error', code: error.code, message: error.message });
      } else if (error instanceof UnknownMessageError) {
        send(socket, { type: 'error', code: 'UNKNOWN_MESSAGE', message: 'Unknown message type' });
      } else {
        console.error('Game session message failed:', error);
        send(socket, { type: 'error', code: 'INTERNAL_ERROR', message: 'Something went wrong' });
      }
    });
  });

  send(socket, { type: 'welcome', role: credential.role, participantId: credential.participantId, session });
  if (adjustSocketCount(credential, 1) === 1) await setCredentialConnected(credential, true);
};

// A sibling of @inithium/realtime's attachRealtimeGateway on the same http.Server, at its own
// path. A separate endpoint (rather than more message types on /realtime) because its identity
// model is different: /realtime authenticates a *user* by JWT, whereas this authenticates a
// *seat in one session* by an opaque token from POST /api/game-sessions(/:code/join) - which is
// what lets guests play, and lets one account host on a TV while also playing on their phone.
// All fan-out still goes through the shared RealtimeProvider, so it scales with it.
export const attachGameSessionGateway = (server: HttpServer): void => {
  const wss = new WebSocketServer({ noServer: true });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((socket) => {
      const tracked = socket as TrackedSocket;
      if (tracked.isAlive === false) {
        tracked.terminate();
        return;
      }
      tracked.isAlive = false;
      tracked.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);
  wss.on('close', () => clearInterval(heartbeat));

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    if (url.pathname !== GAME_SESSION_SOCKET_PATH) return; // Not ours - leave it for /realtime etc.

    // Completes the upgrade even for a bad token, then closes with an application close code -
    // a rejected HTTP upgrade reaches the browser as an opaque 1006 indistinguishable from a
    // network blip, which would leave the client retrying a dead token forever.
    wss.handleUpgrade(request, socket, head, (ws) => {
      const tracked = ws as TrackedSocket;
      tracked.isAlive = true;
      tracked.on('pong', () => {
        tracked.isAlive = true;
      });

      const token = url.searchParams.get('token');
      void (async () => {
        const credential = token ? await resolveSessionCredential(token) : null;
        if (!credential) {
          ws.close(GAME_SESSION_CLOSE_CODES.invalidToken, 'Invalid session token');
          return;
        }
        await bindConnection(ws, credential);
      })().catch((error: unknown) => {
        console.error('Game session connection failed:', error);
        ws.close(1011, 'Internal error');
      });
    });
  });

  console.log(`🎮 Game session gateway listening at ${GAME_SESSION_SOCKET_PATH}`);
};
