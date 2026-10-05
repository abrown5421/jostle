import type { AvatarConfig, GameSettingValues } from '@inithium/db';
import { publishToChannel } from '@inithium/realtime';
import { SYSTEM_ACTIONS } from '../contracts/game-definition.contract';
import type { GameAction, GameActor, GameDefinition, GameSetupContext } from '../contracts/game-definition.contract';
import type {
  GameSessionRecord,
  SessionCredential,
  SessionParticipant,
  SessionParticipantRecord,
  SessionSnapshot,
} from '../contracts/session.contract';
import type { GameCatalogEntry } from '../contracts/game-catalog.contract';
import { getActiveGameCatalog } from '../catalog/catalog-registry';
import { getGameDefinition } from '../games/registry';
import { getActiveRequirementEvaluator } from '../requirements/requirements-registry';
import { getActiveSessionStore } from '../store/store-registry';
import {
  SESSION_EVENTS,
  sessionChannel,
  sessionHostChannel,
  sessionParticipantChannel,
  type ParticipantRemovedReason,
  type SessionEndReason,
} from './channels';
import { applyGameSettingsPatch, defaultGameSettings, findMissingRequiredSettings, resolveGameSettings } from './gameSettings';
import { GameSessionError, isGameSessionError } from './session.errors';
import { generateParticipantId, generateSessionCode, generateSessionToken, normalizeSessionCode } from './sessionCode';

// A hard ceiling on seats per session, independent of any game. Whether a given game can actually
// start with the people present is its catalogue record's minPlayers/maxPlayers (see startGame) -
// this only keeps one lobby from growing without bound. Deliberately kept off the
// SessionSnapshot so clients never advertise it; to players the lobby reads as unlimited.
export const MAX_PARTICIPANTS = 50;
export const MAX_NAME_LENGTH = 16;
// How long a session survives with no host screen connected - covers a refresh, a flaky TV
// wifi, or the host closing the tab and reopening /host (which resumes the same session).
export const HOST_RECONNECT_GRACE_MS = 2 * 60 * 1000;
// How long a game's prepare step (e.g. loading a playlist) may take before the start is refused.
export const GAME_PREPARE_TIMEOUT_MS = 30 * 1000;
const CODE_GENERATION_ATTEMPTS = 20;

const SYSTEM_ACTOR: GameActor = { role: 'system', participantId: null };

const now = (): string => new Date().toISOString();
const store = () => getActiveSessionStore();
const catalog = () => getActiveGameCatalog();

// Every mutation is a read-modify-write against an async store, so two requests touching the
// same session (two players joining at once with the same name, a join racing a kick) would
// otherwise interleave at their awaits. One promise chain per key serializes them. Process-local,
// matching the in-memory store - a shared store would need a shared lock alongside it.
const locks = new Map<string, Promise<unknown>>();

const withLock = async <T>(key: string, task: () => Promise<T>): Promise<T> => {
  const run = (locks.get(key) ?? Promise.resolve()).catch(() => undefined).then(task);
  const tail = run.catch(() => undefined);
  locks.set(key, tail);
  try {
    return await run;
  } finally {
    if (locks.get(key) === tail) locks.delete(key);
  }
};

const hostAbsenceTimers = new Map<string, ReturnType<typeof setTimeout>>();

const cancelHostAbsenceTimer = (code: string): void => {
  const timer = hostAbsenceTimers.get(code);
  if (timer) clearTimeout(timer);
  hostAbsenceTimers.delete(code);
};

const startHostAbsenceTimer = (code: string): void => {
  cancelHostAbsenceTimer(code);
  const timer = setTimeout(() => {
    hostAbsenceTimers.delete(code);
    void endSession(code, 'host-disconnected');
  }, HOST_RECONNECT_GRACE_MS);
  // Never hold the process open just for this.
  timer.unref?.();
  hostAbsenceTimers.set(code, timer);
};

const toParticipants = (record: GameSessionRecord): SessionParticipant[] =>
  record.participants.map(({ token: _token, ...participant }) => participant);

export const toSessionSnapshot = (record: GameSessionRecord): SessionSnapshot => {
  const definition = record.game ? getGameDefinition(record.game.gameId) : undefined;
  return {
    code: record.code,
    status: record.status,
    participants: toParticipants(record),
    scores: record.scores,
    selection: record.selection,
    game: record.game
      ? { gameId: record.game.gameId, view: definition?.publicView?.(record.game.state) ?? null, startedAt: record.game.startedAt }
      : null,
    version: record.version,
    createdAt: record.createdAt,
    serverTime: now(),
  };
};

// The game view a given seat is entitled to: the host screen's hostView, or that player's own
// privateView. Sent on every change (publishGameViews) and in each connection's welcome.
const resolveGameView = (record: GameSessionRecord, credential: SessionCredential): unknown => {
  if (!record.game) return null;
  const definition = getGameDefinition(record.game.gameId);
  if (credential.role === 'host') return definition?.hostView?.(record.game.state) ?? null;
  if (!credential.participantId) return null;
  return definition?.privateView?.(record.game.state, credential.participantId) ?? null;
};

const publishGameViews = async (record: GameSessionRecord): Promise<void> => {
  if (!record.game) return;
  const definition = getGameDefinition(record.game.gameId);
  if (!definition) return;
  const { state } = record.game;
  const publishes: Promise<void>[] = [];
  if (definition.hostView) {
    publishes.push(publishToChannel(sessionHostChannel(record.code), SESSION_EVENTS.gameHost, definition.hostView(state)));
  }
  if (definition.privateView) {
    const { privateView } = definition;
    record.participants.forEach((participant) =>
      publishes.push(
        publishToChannel(
          sessionParticipantChannel(record.code, participant.id),
          SESSION_EVENTS.gamePrivate,
          privateView(state, participant.id),
        ),
      ),
    );
  }
  await Promise.all(publishes);
};

// Game timers. A game declares its next timed event as a function of its state (nextTimeout);
// after every commit the session's single timer is re-armed from the new state, so pausing,
// skipping or ending a game needs no timer bookkeeping in the game itself. Process-local like the
// locks above - a shared store would re-arm each live session's timer from its stored state on
// boot, which is possible precisely because the timer is derived from state.
const gameTimers = new Map<string, ReturnType<typeof setTimeout>>();

const clearGameTimer = (code: string): void => {
  const timer = gameTimers.get(code);
  if (timer) clearTimeout(timer);
  gameTimers.delete(code);
};

const syncGameTimer = (record: GameSessionRecord): void => {
  clearGameTimer(record.code);
  if (record.status !== 'in-game' || !record.game) return;
  const timeout = getGameDefinition(record.game.gameId)?.nextTimeout?.(record.game.state);
  if (!timeout) return;
  const { startedAt } = record.game;
  const timer = setTimeout(
    () => void fireGameTimer(record.code, startedAt, timeout.action),
    Math.max(0, Date.parse(timeout.at) - Date.now()),
  );
  timer.unref?.();
  gameTimers.set(record.code, timer);
};

// `broadcast: false` stores a change no screen needs to see (see GameActionResult.silent).
const commit = async (
  record: GameSessionRecord,
  changes: Partial<GameSessionRecord>,
  { broadcast = true }: { broadcast?: boolean } = {},
): Promise<GameSessionRecord> => {
  const next: GameSessionRecord = { ...record, ...changes, version: record.version + 1, updatedAt: now() };
  await store().save(next);
  syncGameTimer(next);
  if (!broadcast) return next;
  await publishToChannel(sessionChannel(next.code), SESSION_EVENTS.updated, toSessionSnapshot(next));
  await publishGameViews(next);
  return next;
};

// Runs one action through the active game's reducer and commits the result. Callers hold the
// session's lock. An action that changes nothing (a stale timer, a no-op notification) commits
// nothing, so it neither bumps the version nor re-broadcasts.
const applyGameAction = async (record: GameSessionRecord, actor: GameActor, action: GameAction): Promise<GameSessionRecord> => {
  const { game } = record;
  if (!game) throw new GameSessionError('NO_ACTIVE_GAME', 'No game is in progress');
  const definition = getGameDefinition(game.gameId);
  if (!definition) throw new GameSessionError('GAME_NOT_FOUND', `Unknown game "${game.gameId}"`);

  const result = definition.handleAction(game.state, action, { participants: toParticipants(record), actor, now: now() });
  const deltas = Object.entries(result.scoreDeltas ?? {});
  if (result.state === game.state && !result.complete && deltas.length === 0) return record;

  const scores = { ...record.scores };
  deltas.forEach(([participantId, delta]) => {
    scores[participantId] = (scores[participantId] ?? 0) + delta;
  });

  return commit(
    record,
    result.complete ? { status: 'lobby', game: null, scores } : { game: { ...game, state: result.state }, scores },
    { broadcast: !result.silent || result.complete === true || deltas.length > 0 },
  );
};

// Tells a running game something about the room changed (SYSTEM_ACTIONS). Callers hold the lock.
// Never fails the caller - a leave or a disconnect must go through even if the game chokes on it.
const notifyGame = async (record: GameSessionRecord, type: string, payload?: unknown): Promise<GameSessionRecord> => {
  if (record.status !== 'in-game' || !record.game) return record;
  try {
    return await applyGameAction(record, SYSTEM_ACTOR, { type, payload });
  } catch (error) {
    console.error(`Game "${record.game.gameId}" failed to handle ${type}:`, error);
    return record;
  }
};

const fireGameTimer = (code: string, startedAt: string, action: GameAction): Promise<void> =>
  withLock(code, async () => {
    const record = await store().get(code);
    // A timer armed for an earlier game (or a session that has since ended) is meaningless.
    if (!record?.game || record.status !== 'in-game' || record.game.startedAt !== startedAt) return;
    await applyGameAction(record, SYSTEM_ACTOR, action);
  }).catch((error: unknown) => {
    console.error('Game timer failed:', error);
  });

const requireSession = async (code: string): Promise<GameSessionRecord> => {
  const record = await store().get(code);
  if (!record) throw new GameSessionError('SESSION_NOT_FOUND', 'No session in progress with that code');
  return record;
};

const requireHost = (credential: SessionCredential): void => {
  if (credential.role !== 'host') throw new GameSessionError('NOT_AUTHORIZED', 'Only the host can do that');
};

const validateName = (raw: string): string => {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) throw new GameSessionError('INVALID_NAME', 'Name is required');
  if (name.length > MAX_NAME_LENGTH) {
    throw new GameSessionError('INVALID_NAME', `Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }
  return name;
};

const isNameTaken = (record: GameSessionRecord, name: string, exceptParticipantId?: string): boolean =>
  record.participants.some(
    (participant) => participant.id !== exceptParticipantId && participant.name.toLowerCase() === name.toLowerCase(),
  );

export interface HostedSession {
  readonly hostToken: string;
  readonly session: SessionSnapshot;
}

// Get-or-create: a host has at most one live session, and calling this again (a refresh of
// /host, React StrictMode's double effect, opening /host on a second screen) hands back that
// same session rather than orphaning it. The host is never added as a participant.
// Read-only counterpart of hostSession: the host's live session if they have one, never creating
// one. Lets host-flow pages other than /host (the catalogue, the settings page) find and rejoin
// the session they belong to.
export const findHostedSession = async (hostUserId: string): Promise<HostedSession | null> => {
  const existing = await store().findByHostUserId(hostUserId);
  return existing ? { hostToken: existing.hostToken, session: toSessionSnapshot(existing) } : null;
};

export const hostSession = (hostUserId: string): Promise<HostedSession> =>
  withLock(`host:${hostUserId}`, async () => {
    const existing = await store().findByHostUserId(hostUserId);
    if (existing) return { hostToken: existing.hostToken, session: toSessionSnapshot(existing) };

    let code = generateSessionCode();
    for (let attempt = 1; (await store().get(code)) && attempt < CODE_GENERATION_ATTEMPTS; attempt += 1) {
      code = generateSessionCode();
    }
    if (await store().get(code)) throw new Error('Could not allocate a unique session code');

    const timestamp = now();
    const record: GameSessionRecord = {
      code,
      hostUserId,
      hostToken: generateSessionToken(),
      status: 'lobby',
      participants: [],
      scores: {},
      selection: null,
      game: null,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await store().save(record);
    // Armed until the host's screen actually connects, so a session whose host bailed before
    // the socket ever opened doesn't live forever.
    startHostAbsenceTimer(code);
    return { hostToken: record.hostToken, session: toSessionSnapshot(record) };
  });

export interface JoinSessionInput {
  readonly name: string;
  readonly userId: string | null;
  readonly avatar: AvatarConfig | null;
  // A token this device already holds for this session (see the web client's stored
  // credentials). Lets a player who lands back on /join reclaim their own slot - and their own
  // name - instead of colliding with their own disconnected ghost.
  readonly rejoinToken?: string;
}

export interface JoinedSession {
  readonly participantId: string;
  readonly playerToken: string;
  readonly session: SessionSnapshot;
}

export const joinSession = (rawCode: string, input: JoinSessionInput): Promise<JoinedSession> => {
  const code = normalizeSessionCode(rawCode);
  return withLock(code, async () => {
    const record = await requireSession(code);
    const name = validateName(input.name);

    const rejoining = input.rejoinToken ? await store().resolveToken(input.rejoinToken) : null;
    const existing =
      rejoining?.code === code && rejoining.participantId
        ? record.participants.find((participant) => participant.id === rejoining.participantId)
        : undefined;

    if (existing) {
      if (isNameTaken(record, name, existing.id)) throw new GameSessionError('NAME_TAKEN', 'That name is already taken');
      const next = await commit(record, {
        participants: record.participants.map((participant) =>
          participant.id === existing.id
            ? { ...participant, name, userId: input.userId ?? participant.userId, avatar: input.avatar ?? participant.avatar }
            : participant,
        ),
      });
      return { participantId: existing.id, playerToken: existing.token, session: toSessionSnapshot(next) };
    }

    if (record.status !== 'lobby') {
      throw new GameSessionError('SESSION_NOT_JOINABLE', 'That session already has a game in progress');
    }
    if (record.participants.length >= MAX_PARTICIPANTS) throw new GameSessionError('SESSION_FULL', 'That session is full');
    if (isNameTaken(record, name)) throw new GameSessionError('NAME_TAKEN', 'That name is already taken');

    const participant: SessionParticipantRecord = {
      id: generateParticipantId(),
      name,
      userId: input.userId,
      avatar: input.avatar,
      // Flipped true by the gateway once this player's socket actually opens.
      isConnected: false,
      joinedAt: now(),
      token: generateSessionToken(),
    };
    const next = await commit(record, {
      participants: [...record.participants, participant],
      scores: { ...record.scores, [participant.id]: 0 },
    });
    return { participantId: participant.id, playerToken: participant.token, session: toSessionSnapshot(next) };
  });
};

export const resolveSessionCredential = (token: string): Promise<SessionCredential | null> => store().resolveToken(token);

export const getSessionSnapshot = async (code: string): Promise<SessionSnapshot | null> => {
  const record = await store().get(normalizeSessionCode(code));
  return record ? toSessionSnapshot(record) : null;
};

export interface SessionWelcome {
  readonly session: SessionSnapshot;
  // The seat's game view (host -> hostView, player -> their privateView), null outside a game.
  readonly gameView: unknown;
}

// Everything a freshly opened socket needs, read in one go so the snapshot and the game view
// agree - a reconnecting device is fully caught up by its welcome alone.
export const getSessionWelcome = async (credential: SessionCredential): Promise<SessionWelcome | null> => {
  const record = await store().get(credential.code);
  return record ? { session: toSessionSnapshot(record), gameView: resolveGameView(record, credential) } : null;
};

// Called by the gateway only on a credential's first socket opening / last socket closing, so
// several tabs holding the same credential don't flap this.
export const setCredentialConnected = (credential: SessionCredential, isConnected: boolean): Promise<void> =>
  withLock(credential.code, async () => {
    const record = await store().get(credential.code);
    if (!record) return;

    if (credential.role === 'host') {
      if (isConnected) cancelHostAbsenceTimer(record.code);
      else startHostAbsenceTimer(record.code);
      await notifyGame(record, SYSTEM_ACTIONS.hostConnection, { connected: isConnected });
      return;
    }

    if (!record.participants.some((participant) => participant.id === credential.participantId)) return;
    const next = await commit(record, {
      participants: record.participants.map((participant) =>
        participant.id === credential.participantId ? { ...participant, isConnected } : participant,
      ),
    });
    await notifyGame(next, SYSTEM_ACTIONS.participantsChanged);
  });

const removeParticipant = async (
  record: GameSessionRecord,
  participantId: string,
  reason: ParticipantRemovedReason,
): Promise<void> => {
  if (!record.participants.some((participant) => participant.id === participantId)) {
    throw new GameSessionError('PARTICIPANT_NOT_FOUND', 'That player is not in this session');
  }
  const { [participantId]: _removedScore, ...scores } = record.scores;
  const next = await commit(record, {
    participants: record.participants.filter((participant) => participant.id !== participantId),
    scores,
  });
  // After the commit, so the removed token no longer resolves by the time their sockets close.
  await publishToChannel(sessionParticipantChannel(record.code, participantId), SESSION_EVENTS.participantRemoved, { reason });
  await notifyGame(next, SYSTEM_ACTIONS.participantsChanged);
};

export const leaveSession = (credential: SessionCredential): Promise<void> =>
  withLock(credential.code, async () => {
    if (credential.role !== 'player' || !credential.participantId) return;
    await removeParticipant(await requireSession(credential.code), credential.participantId, 'left');
  });

export const kickParticipant = (credential: SessionCredential, participantId: string): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    await removeParticipant(await requireSession(credential.code), participantId, 'kicked');
  });

export const endSession = (code: string, reason: SessionEndReason): Promise<void> =>
  withLock(code, async () => {
    cancelHostAbsenceTimer(code);
    clearGameTimer(code);
    const record = await store().get(code);
    if (!record) return;
    await store().delete(code);
    await publishToChannel(sessionChannel(code), SESSION_EVENTS.ended, { reason });
  });

export const endSessionAsHost = async (credential: SessionCredential): Promise<void> => {
  requireHost(credential);
  await endSession(credential.code, 'host-ended');
};

// Game selection and settings. The host picks a game from the catalogue (select), configures it
// (update-settings) while players are still free to join, then starts it. Every step commits a
// new snapshot, so every screen - host and players - follows along over the same pub/sub
// channels. Whether a game exists and what its settings look like comes from the injected
// GameCatalog; whether it can actually be *played* is the GameDefinition registry.
const requireLobby = (record: GameSessionRecord): void => {
  if (record.status !== 'lobby') throw new GameSessionError('GAME_IN_PROGRESS', 'A game is already in progress');
};

// gameId arrives straight off the socket, so it isn't trusted to even be a string.
const requireCatalogGame = async (gameId: unknown): Promise<GameCatalogEntry> => {
  const game = typeof gameId === 'string' && gameId ? await catalog().findGame(gameId) : null;
  if (!game) throw new GameSessionError('GAME_NOT_FOUND', `Unknown game "${String(gameId)}"`);
  return game;
};

const requireSelection = (record: GameSessionRecord) => {
  if (!record.selection) throw new GameSessionError('NO_GAME_SELECTED', 'Pick a game first');
  return record.selection;
};

const requirePlayerCount = (record: GameSessionRecord, game: GameCatalogEntry): void => {
  const playerCount = record.participants.length;
  if (playerCount < game.minPlayers || playerCount > game.maxPlayers) {
    throw new GameSessionError('INVALID_PLAYER_COUNT', `${game.title} needs ${game.minPlayers}-${game.maxPlayers} players`);
  }
};

// The catalogue's host requirements (e.g. a connected Spotify Premium account), checked against
// the session's host - on pick and again on start, since a connection can lapse in between.
const requireHostRequirements = async (record: GameSessionRecord, game: GameCatalogEntry): Promise<void> => {
  if (!game.requirements?.length) return;
  const [blocker] = await getActiveRequirementEvaluator().evaluate(record.hostUserId, game.requirements);
  if (blocker) {
    throw new GameSessionError('REQUIREMENTS_NOT_MET', blocker.reason, { requirement: blocker.requirement });
  }
};

const sameSettings = (a: GameSettingValues, b: GameSettingValues): boolean => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
};

export const selectGame = (credential: SessionCredential, gameId: string): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    const record = await requireSession(credential.code);
    requireLobby(record);
    const game = await requireCatalogGame(gameId);
    await requireHostRequirements(record, game);
    // Re-picking the current game keeps its settings - so a host reopening a "host this game"
    // link, or tapping the same card twice, doesn't silently reset what they configured.
    if (record.selection?.gameId === game.slug) return;
    await commit(record, { selection: { gameId: game.slug, settings: defaultGameSettings(game.settings) } });
  });

export const updateGameSettings = (credential: SessionCredential, patch: unknown): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    const record = await requireSession(credential.code);
    requireLobby(record);
    const selection = requireSelection(record);
    const game = await requireCatalogGame(selection.gameId);
    const settings = applyGameSettingsPatch(game.settings, resolveGameSettings(game.settings, selection.settings), patch);
    await commit(record, { selection: { ...selection, settings } });
  });

export const clearGameSelection = (credential: SessionCredential): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    const record = await requireSession(credential.code);
    requireLobby(record);
    if (!record.selection) return;
    await commit(record, { selection: null });
  });

// Sessions whose game is between its checks and its first state (i.e. preparing). Process-local,
// like the locks.
const startingSessions = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGameDefinition = GameDefinition<any, any, any>;

const runPrepare = async (definition: AnyGameDefinition, setup: GameSetupContext): Promise<unknown> => {
  if (!definition.prepare) return undefined;
  const controller = new AbortController();
  const timedOut = new Promise<never>((_, reject) =>
    controller.signal.addEventListener('abort', () =>
      reject(new GameSessionError('GAME_SETUP_FAILED', 'Getting the game ready took too long - try again')),
    ),
  );
  const timer = setTimeout(() => controller.abort(), GAME_PREPARE_TIMEOUT_MS);
  timer.unref?.();
  try {
    return await Promise.race([definition.prepare({ ...setup, signal: controller.signal }), timedOut]);
  } catch (error) {
    if (isGameSessionError(error)) throw error;
    console.error(`Preparing game "${definition.id}" failed:`, error);
    throw new GameSessionError('GAME_SETUP_FAILED', 'Something went wrong getting the game ready - try again');
  } finally {
    clearTimeout(timer);
  }
};

// Two locked passes around an unlocked prepare: a game's prepare may hit the network for seconds
// (iPod War pages through a playlist), and holding the session's lock that long would stall every
// join and connection change behind it. The second pass re-checks what the first established, so
// the game only starts with exactly the selection and settings that were prepared for.
export const startGame = async (credential: SessionCredential): Promise<void> => {
  requireHost(credential);
  const { code } = credential;

  const { definition, gameId, setup } = await withLock(code, async () => {
    if (startingSessions.has(code)) throw new GameSessionError('GAME_STARTING', 'The game is already starting');
    const record = await requireSession(code);
    requireLobby(record);
    const selection = requireSelection(record);
    const game = await requireCatalogGame(selection.gameId);
    requirePlayerCount(record, game);

    const found = getGameDefinition(game.slug);
    if (!found) throw new GameSessionError('GAME_NOT_PLAYABLE', `${game.title} isn't playable yet`);
    await requireHostRequirements(record, game);

    // Re-resolved rather than trusted as stored, in case the catalogue record changed since the
    // host configured it.
    const settings = resolveGameSettings(game.settings, selection.settings);
    const [missing] = findMissingRequiredSettings(game.settings, settings);
    if (missing) throw new GameSessionError('SETTING_REQUIRED', `Choose a ${missing.label.toLowerCase()} first`);

    const context: GameSetupContext = { participants: toParticipants(record), settings, now: now(), hostUserId: record.hostUserId };
    found.validateSettings?.(context);
    startingSessions.add(code);
    return { definition: found, gameId: game.slug, setup: context };
  });

  try {
    const prepared = await runPrepare(definition, setup);
    await withLock(code, async () => {
      const record = await requireSession(code);
      requireLobby(record);
      const selection = requireSelection(record);
      const game = await requireCatalogGame(selection.gameId);
      if (game.slug !== gameId || !sameSettings(resolveGameSettings(game.settings, selection.settings), setup.settings)) {
        throw new GameSessionError('INVALID_SETTINGS', 'The game changed while it was starting - press Start again');
      }
      requirePlayerCount(record, game);

      const startedAt = now();
      const context: GameSetupContext = { ...setup, participants: toParticipants(record), now: startedAt };
      await commit(record, {
        status: 'in-game',
        selection: { ...selection, settings: setup.settings },
        game: { gameId, state: definition.createInitialState(context, prepared), startedAt },
      });
    });
  } finally {
    startingSessions.delete(code);
  }
};

export const dispatchGameAction = (credential: SessionCredential, action: GameAction): Promise<void> =>
  withLock(credential.code, async () => {
    // Straight off the socket. 'system:' types are the service's own (SYSTEM_ACTIONS) - no client
    // may send one, whatever the game would make of it.
    if (typeof action?.type !== 'string' || !action.type || action.type.startsWith('system:')) {
      throw new GameSessionError('INVALID_ACTION', 'Unknown game action');
    }
    const record = await requireSession(credential.code);
    await applyGameAction(record, { role: credential.role, participantId: credential.participantId }, action);
  });
