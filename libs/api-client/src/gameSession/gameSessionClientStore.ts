import type {
  GAME_SESSION_CLOSE_CODES,
  ParticipantRemovedReason,
  SESSION_EVENTS,
  SessionClientMessage,
  SessionEndReason,
  SessionErrorMessage,
  SessionRole,
  SessionServerMessage,
  SessionSnapshot,
} from '@inithium/game-session';

// Mirrored rather than imported: @inithium/game-session's runtime index pulls in `ws` and
// node:crypto, so the browser may only `import type` from it. `satisfies` keeps these from
// drifting out of sync with the server's values.
const CLOSE_CODES = { invalidToken: 4401, removed: 4403, sessionEnded: 4410 } as const satisfies typeof GAME_SESSION_CLOSE_CODES;
const EVENTS = {
  updated: 'session:updated',
  ended: 'session:ended',
  participantRemoved: 'participant:removed',
  gamePrivate: 'game:private',
  gameHost: 'game:host',
} as const satisfies typeof SESSION_EVENTS;
const SOCKET_PATH = '/realtime/session';

// How long a released connection lingers before actually closing - long enough for one page to
// unmount and the next to mount and retain the same seat (see retainGameSession).
const RELEASE_GRACE_MS = 2000;

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 10000;

export type GameSessionConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';
// Why the connection closed for good - only set alongside status 'closed'.
export type GameSessionCloseReason = 'session-ended' | 'removed' | 'invalid-token';

export interface GameSessionClientState {
  readonly status: GameSessionConnectionStatus;
  readonly role: SessionRole | null;
  readonly participantId: string | null;
  readonly session: SessionSnapshot | null;
  // The active game's privateView for this device's player (null for the host / no game).
  readonly privateView: unknown;
  // The active game's hostView, on the host screen (null for players / no game).
  readonly hostView: unknown;
  // Server clock minus this device's, from the latest snapshot - game deadlines are server time,
  // so countdowns add this to Date.now() (see getGameSessionServerNow).
  readonly serverOffsetMs: number;
  readonly closeReason: GameSessionCloseReason | null;
  readonly closeDetail: SessionEndReason | ParticipantRemovedReason | null;
  readonly lastError: SessionErrorMessage | null;
}

type GameSessionEventListener = (event: string, payload: unknown) => void;

const INITIAL_STATE: GameSessionClientState = {
  status: 'idle',
  role: null,
  participantId: null,
  session: null,
  privateView: null,
  hostView: null,
  serverOffsetMs: 0,
  closeReason: null,
  closeDetail: null,
  lastError: null,
};

// Module-level singleton, same recipe as realtimeClientStore.ts: one device sits in at most one
// session at a time, as either its host screen or one player, and any component can read it
// without a Provider. Kept separate from the user-level /realtime socket because the identity
// differs (a session seat, not a user) and guests have no user socket at all.
let socket: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let state: GameSessionClientState = INITIAL_STATE;

const stateListeners = new Set<() => void>();
const eventListeners = new Set<GameSessionEventListener>();

// Replaced, never mutated, so useSyncExternalStore sees a new reference on every change.
const setState = (patch: Partial<GameSessionClientState>): void => {
  state = { ...state, ...patch };
  stateListeners.forEach((listener) => listener());
};

const resolveSocketUrl = (token: string): string => {
  const baseUrl = import.meta.env?.['VITE_API_URL'] ?? 'http://localhost:3000';
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = SOCKET_PATH;
  url.searchParams.set('token', token);
  return url.toString();
};

// See realtimeClientStore.ts's teardownSocket - nulling handlers first makes a replaced socket
// inert even while its close handshake is still in flight.
const teardownSocket = (ws: WebSocket | null): void => {
  if (!ws) return;
  ws.onopen = null;
  ws.onmessage = null;
  ws.onclose = null;
  ws.onerror = null;
  ws.close();
};

const clearReconnectTimer = (): void => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
};

const scheduleReconnect = (): void => {
  if (!currentToken || reconnectTimer) return;
  const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempt += 1;
    open();
  }, delay);
};

const offsetFrom = (session: SessionSnapshot): number =>
  session.serverTime ? Date.parse(session.serverTime) - Date.now() : state.serverOffsetMs;

const handleEvent = (event: string, payload: unknown): void => {
  switch (event) {
    case EVENTS.updated: {
      const session = payload as SessionSnapshot;
      // Drop a stale snapshot that raced a newer one.
      if (!state.session || session.version >= state.session.version) {
        // A finished game's views would otherwise linger into the lobby.
        const clearedViews = session.game ? {} : { privateView: null, hostView: null };
        setState({ session, serverOffsetMs: offsetFrom(session), ...clearedViews });
      }
      break;
    }
    case EVENTS.ended:
      setState({ closeDetail: (payload as { reason: SessionEndReason }).reason });
      break;
    case EVENTS.participantRemoved:
      setState({ closeDetail: (payload as { reason: ParticipantRemovedReason }).reason });
      break;
    case EVENTS.gamePrivate:
      setState({ privateView: payload });
      break;
    case EVENTS.gameHost:
      setState({ hostView: payload });
      break;
  }
  eventListeners.forEach((listener) => listener(event, payload));
};

const handleMessage = (raw: string): void => {
  let message: SessionServerMessage;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }
  switch (message.type) {
    case 'welcome':
      setState({
        role: message.role,
        participantId: message.participantId,
        session: message.session,
        serverOffsetMs: offsetFrom(message.session),
        privateView: message.role === 'player' ? message.gameView : null,
        hostView: message.role === 'host' ? message.gameView : null,
      });
      break;
    case 'event':
      handleEvent(message.event, message.payload);
      break;
    case 'error':
      setState({ lastError: message });
      break;
  }
};

const resolveTerminalReason = (code: number): GameSessionCloseReason | null => {
  if (code === CLOSE_CODES.sessionEnded) return 'session-ended';
  if (code === CLOSE_CODES.removed) return 'removed';
  if (code === CLOSE_CODES.invalidToken) return 'invalid-token';
  return null;
};

const open = (): void => {
  if (!currentToken) return;
  setState({ status: reconnectAttempt > 0 ? 'reconnecting' : 'connecting' });

  const ws = new WebSocket(resolveSocketUrl(currentToken));
  socket = ws;

  ws.onopen = () => {
    reconnectAttempt = 0;
    setState({ status: 'open' });
  };
  ws.onmessage = (event) => handleMessage(event.data);
  ws.onclose = (event) => {
    socket = null;
    const terminalReason = resolveTerminalReason(event.code);
    if (terminalReason) {
      // Reconnecting with this token can never succeed - stop here and let the UI explain why.
      currentToken = null;
      setState({ status: 'closed', closeReason: terminalReason });
      return;
    }
    setState({ status: 'reconnecting' });
    scheduleReconnect();
  };
  ws.onerror = () => {
    // onclose always follows; reconnection is decided there.
    ws.close();
  };
};

// Opens (or switches to) the session seat identified by `token` - a hostToken or playerToken.
export const connectGameSession = (token: string): void => {
  if (currentToken === token && state.status !== 'closed' && state.status !== 'idle') return;
  clearReconnectTimer();
  teardownSocket(socket);
  socket = null;
  currentToken = token;
  reconnectAttempt = 0;
  state = INITIAL_STATE;
  open();
};

// Drops this device's connection only. Leaving the seat (players) or ending the session (host)
// are explicit messages - see sendGameSessionMessage - so a mere navigation away or refresh
// keeps the seat/session intact for the reconnect.
export const disconnectGameSession = (): void => {
  currentToken = null;
  clearReconnectTimer();
  teardownSocket(socket);
  socket = null;
  reconnectAttempt = 0;
  setState(INITIAL_STATE);
};

let retainCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

// Reference-counted alternative to connect/disconnect, for a seat that spans several pages - the
// host flow moves between /host, /games and /settings/:code, and dropping the socket on each
// navigation would start the server's host-absence countdown every time. Each page retains the
// seat while mounted; the socket only closes once nothing has held it for RELEASE_GRACE_MS.
// Returns the release function (idempotent), shaped to be returned straight from a useEffect.
export const retainGameSession = (token: string): (() => void) => {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = null;
  retainCount += 1;
  connectGameSession(token);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount = Math.max(retainCount - 1, 0);
    if (retainCount > 0) return;
    releaseTimer = setTimeout(() => {
      releaseTimer = null;
      // Only if this is still the seat that was retained - the device may have since switched to
      // another one (e.g. hosting, then joining a game as a player via connectGameSession).
      if (retainCount === 0 && currentToken === token) disconnectGameSession();
    }, RELEASE_GRACE_MS);
  };
};

export const sendGameSessionMessage = (message: SessionClientMessage): boolean => {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(message));
  return true;
};

export const getGameSessionState = (): GameSessionClientState => state;

// "Now" on the server's clock, in epoch ms - what a countdown to a game deadline should use.
export const getGameSessionServerNow = (): number => Date.now() + state.serverOffsetMs;

export const subscribeToGameSessionState = (listener: () => void): (() => void) => {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
};

// Raw event feed for future game UIs that need more than the derived state above (e.g. a
// one-shot "time's up" cue that shouldn't live in state).
export const subscribeToGameSessionEvents = (listener: GameSessionEventListener): (() => void) => {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
};
