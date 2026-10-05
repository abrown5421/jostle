import type { AvatarConfig } from '@inithium/db';
import { publishToChannel } from '@inithium/realtime';
import type { GameAction, GameActor } from '../contracts/game-definition.contract';
import type {
  GameSessionRecord,
  SessionCredential,
  SessionParticipantRecord,
  SessionSnapshot,
} from '../contracts/session.contract';
import type { GameCatalogEntry } from '../contracts/game-catalog.contract';
import { getActiveGameCatalog } from '../catalog/catalog-registry';
import { getGameDefinition } from '../games/registry';
import { getActiveSessionStore } from '../store/store-registry';
import {
  SESSION_EVENTS,
  sessionChannel,
  sessionParticipantChannel,
  type ParticipantRemovedReason,
  type SessionEndReason,
} from './channels';
import { applyGameSettingsPatch, defaultGameSettings, resolveGameSettings } from './gameSettings';
import { GameSessionError } from './session.errors';
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
const CODE_GENERATION_ATTEMPTS = 20;

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

export const toSessionSnapshot = (record: GameSessionRecord): SessionSnapshot => {
  const definition = record.game ? getGameDefinition(record.game.gameId) : undefined;
  return {
    code: record.code,
    status: record.status,
    participants: record.participants.map(({ token: _token, ...participant }) => participant),
    scores: record.scores,
    selection: record.selection,
    game: record.game
      ? { gameId: record.game.gameId, view: definition?.publicView?.(record.game.state) ?? null, startedAt: record.game.startedAt }
      : null,
    version: record.version,
    createdAt: record.createdAt,
  };
};

const commit = async (record: GameSessionRecord, changes: Partial<GameSessionRecord>): Promise<GameSessionRecord> => {
  const next: GameSessionRecord = { ...record, ...changes, version: record.version + 1, updatedAt: now() };
  await store().save(next);
  await publishToChannel(sessionChannel(next.code), SESSION_EVENTS.updated, toSessionSnapshot(next));
  return next;
};

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

const publishPrivateViews = async (record: GameSessionRecord): Promise<void> => {
  if (!record.game) return;
  const definition = getGameDefinition(record.game.gameId);
  if (!definition?.privateView) return;
  const { state } = record.game;
  await Promise.all(
    record.participants.map((participant) =>
      publishToChannel(
        sessionParticipantChannel(record.code, participant.id),
        SESSION_EVENTS.gamePrivate,
        definition.privateView?.(state, participant.id),
      ),
    ),
  );
};

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

// Called by the gateway only on a credential's first socket opening / last socket closing, so
// several tabs holding the same credential don't flap this.
export const setCredentialConnected = (credential: SessionCredential, isConnected: boolean): Promise<void> =>
  withLock(credential.code, async () => {
    const record = await store().get(credential.code);
    if (!record) return;

    if (credential.role === 'host') {
      if (isConnected) cancelHostAbsenceTimer(record.code);
      else startHostAbsenceTimer(record.code);
      return;
    }

    if (!record.participants.some((participant) => participant.id === credential.participantId)) return;
    await commit(record, {
      participants: record.participants.map((participant) =>
        participant.id === credential.participantId ? { ...participant, isConnected } : participant,
      ),
    });
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
  await commit(record, {
    participants: record.participants.filter((participant) => participant.id !== participantId),
    scores,
  });
  // After the commit, so the removed token no longer resolves by the time their sockets close.
  await publishToChannel(sessionParticipantChannel(record.code, participantId), SESSION_EVENTS.participantRemoved, { reason });
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

export const selectGame = (credential: SessionCredential, gameId: string): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    const record = await requireSession(credential.code);
    requireLobby(record);
    const game = await requireCatalogGame(gameId);
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

export const startGame = (credential: SessionCredential): Promise<void> =>
  withLock(credential.code, async () => {
    requireHost(credential);
    const record = await requireSession(credential.code);
    requireLobby(record);
    const selection = requireSelection(record);
    const game = await requireCatalogGame(selection.gameId);

    const playerCount = record.participants.length;
    if (playerCount < game.minPlayers || playerCount > game.maxPlayers) {
      throw new GameSessionError('INVALID_PLAYER_COUNT', `${game.title} needs ${game.minPlayers}-${game.maxPlayers} players`);
    }

    const definition = getGameDefinition(game.slug);
    if (!definition) throw new GameSessionError('GAME_NOT_PLAYABLE', `${game.title} isn't playable yet`);

    // Re-resolved rather than trusted as stored, in case the catalogue record changed since the
    // host configured it.
    const settings = resolveGameSettings(game.settings, selection.settings);
    const startedAt = now();
    const setup = { participants: toSessionSnapshot(record).participants, settings, now: startedAt };
    definition.validateSettings?.(setup);

    const next = await commit(record, {
      status: 'in-game',
      selection: { ...selection, settings },
      game: { gameId: game.slug, state: definition.createInitialState(setup), startedAt },
    });
    await publishPrivateViews(next);
  });

export const dispatchGameAction = (credential: SessionCredential, action: GameAction): Promise<void> =>
  withLock(credential.code, async () => {
    const record = await requireSession(credential.code);
    if (!record.game) throw new GameSessionError('NO_ACTIVE_GAME', 'No game is in progress');
    const definition = getGameDefinition(record.game.gameId);
    if (!definition) throw new GameSessionError('GAME_NOT_FOUND', `Unknown game "${record.game.gameId}"`);

    const actor: GameActor = { role: credential.role, participantId: credential.participantId };
    const participants = toSessionSnapshot(record).participants;
    const result = definition.handleAction(record.game.state, action, { participants, actor, now: now() });

    const scores = { ...record.scores };
    Object.entries(result.scoreDeltas ?? {}).forEach(([participantId, delta]) => {
      scores[participantId] = (scores[participantId] ?? 0) + delta;
    });

    const next = await commit(
      record,
      result.complete
        ? { status: 'lobby', game: null, scores }
        : { game: { ...record.game, state: result.state }, scores },
    );
    await publishPrivateViews(next);
  });
