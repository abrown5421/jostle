import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToChannel } from '@inithium/realtime';
import type { GameDefinition } from '../contracts/game-definition.contract';
import type { GameCatalogEntry } from '../contracts/game-catalog.contract';
import type { SessionCredential, SessionSnapshot } from '../contracts/session.contract';
import { setActiveGameCatalog } from '../catalog/catalog-registry';
import { resetGameDefinitions, setGameDefinitionsForTesting } from '../games/registry';
import { setActiveRequirementEvaluator } from '../requirements/requirements-registry';
import { getActiveSessionStore } from '../store/store-registry';
import { SESSION_EVENTS, sessionHostChannel, sessionParticipantChannel } from './channels';
import {
  dispatchGameAction,
  endSession,
  getSessionSnapshot,
  getSessionWelcome,
  hostSession,
  joinSession,
  selectGame,
  setCredentialConnected,
  startGame,
  updateGameSettings,
} from './session.service';

// The generic game runtime - timers, prepare, host/private views, system notifications and host
// requirements - exercised against a tiny purpose-built game, straight through the service.

interface TickState {
  readonly ticks: number;
  readonly endsAt: string | null;
  readonly remainingMs: number | null;
  readonly seq: number;
  readonly prepared: unknown;
  readonly notifications: readonly string[];
}

const TICK_MS = 1000;
const MAX_TICKS = 3;
const at = (now: string, ms: number) => new Date(Date.parse(now) + ms).toISOString();

const TICK_GAME: GameDefinition<TickState> = {
  id: 'tick-game',
  createInitialState: ({ now }, prepared) => ({
    ticks: 0,
    endsAt: at(now, TICK_MS),
    remainingMs: null,
    seq: 0,
    prepared: prepared ?? null,
    notifications: [],
  }),
  handleAction: (state, action, { actor, now }) => {
    switch (action.type) {
      case 'tick': {
        if (actor.role !== 'system') throw new Error('only the system ticks');
        if ((action.payload as { seq: number }).seq !== state.seq) return { state };
        const ticks = state.ticks + 1;
        return {
          state: { ...state, ticks, seq: state.seq + 1, endsAt: ticks >= MAX_TICKS ? null : at(now, TICK_MS) },
          scoreDeltas: {},
        };
      }
      case 'pause':
        if (!state.endsAt) return { state };
        return { state: { ...state, endsAt: null, remainingMs: Date.parse(state.endsAt) - Date.parse(now), seq: state.seq + 1 } };
      case 'resume':
        if (state.remainingMs === null) return { state };
        return { state: { ...state, endsAt: at(now, state.remainingMs), remainingMs: null, seq: state.seq + 1 } };
      case 'finish':
        return { state, complete: true };
      default:
        return { state: { ...state, notifications: [...state.notifications, `${actor.role}:${action.type}`] } };
    }
  },
  nextTimeout: (state) => (state.endsAt ? { at: state.endsAt, action: { type: 'tick', payload: { seq: state.seq } } } : null),
  publicView: (state) => ({ ticks: state.ticks, paused: state.endsAt === null }),
  hostView: (state) => ({ secret: 'host-only', ticks: state.ticks }),
  privateView: (state, participantId) => ({ me: participantId, ticks: state.ticks }),
};

let prepareImpl: (signal: AbortSignal) => Promise<unknown> = async () => 'loaded';
const PREPARED_GAME: GameDefinition<TickState, Record<string, string | number | boolean>, unknown> = {
  ...(TICK_GAME as unknown as GameDefinition<TickState, Record<string, string | number | boolean>, unknown>),
  id: 'prepared-game',
  prepare: ({ signal }) => prepareImpl(signal),
};

const entry = (slug: string, extra: Partial<GameCatalogEntry> = {}): GameCatalogEntry => ({
  slug,
  title: slug,
  minPlayers: 1,
  maxPlayers: 8,
  settings: [{ key: 'rounds', label: 'Rounds', type: 'number', default: 3, min: 1, max: 10 }],
  ...extra,
});

const CATALOG: Record<string, GameCatalogEntry> = {
  'tick-game': entry('tick-game'),
  'prepared-game': entry('prepared-game'),
  'gated-game': entry('gated-game', { requirements: [{ kind: 'integration', provider: 'spotify', capabilities: ['playback'] }] }),
  'resource-game': entry('resource-game', {
    settings: [{ key: 'list', label: 'Playlist', type: 'integration-resource', default: '', provider: 'spotify', resource: 'playlist', required: true }],
  }),
};

let hostCounter = 0;
const startSession = async (gameId: string) => {
  hostCounter += 1;
  const hosted = await hostSession(`runtime-host-${hostCounter}`);
  const host: SessionCredential = { code: hosted.session.code, role: 'host', participantId: null };
  const joined = await joinSession(hosted.session.code, { name: 'Pat', userId: null, avatar: null });
  const player: SessionCredential = { code: hosted.session.code, role: 'player', participantId: joined.participantId };
  await selectGame(host, gameId);
  return { code: hosted.session.code, host, player, participantId: joined.participantId };
};

const stateOf = async (code: string) => (await getActiveSessionStore().get(code))?.game?.state as TickState | undefined;
const viewOf = async (code: string) => (await getSessionSnapshot(code))?.game?.view as { ticks: number; paused: boolean } | undefined;

beforeAll(() => {
  setActiveGameCatalog({ name: 'runtime-test', findGame: async (gameId) => CATALOG[gameId] ?? null });
  setGameDefinitionsForTesting([TICK_GAME, PREPARED_GAME, { ...TICK_GAME, id: 'gated-game' }, { ...TICK_GAME, id: 'resource-game' }]);
});

afterAll(() => {
  resetGameDefinitions();
  setActiveRequirementEvaluator({ name: 'permissive', evaluate: async () => [] });
});

describe('game timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches each timed action as the system and stops when the game asks for no more', async () => {
    const { code, host } = await startSession('tick-game');
    await startGame(host);
    expect(await viewOf(code)).toEqual({ ticks: 0, paused: false });

    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect((await viewOf(code))?.ticks).toBe(1);
    await vi.advanceTimersByTimeAsync(TICK_MS * 10);
    expect((await viewOf(code))?.ticks).toBe(MAX_TICKS);
  });

  it('freezes on pause and carries on with the time that was left on resume', async () => {
    const { code, host } = await startSession('tick-game');
    await startGame(host);

    await vi.advanceTimersByTimeAsync(400);
    await dispatchGameAction(host, { type: 'pause' });
    await vi.advanceTimersByTimeAsync(TICK_MS * 5);
    expect(await viewOf(code)).toEqual({ ticks: 0, paused: true });

    await dispatchGameAction(host, { type: 'resume' });
    await vi.advanceTimersByTimeAsync(599);
    expect((await viewOf(code))?.ticks).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect((await viewOf(code))?.ticks).toBe(1);
  });

  it('drops the timer when the game completes or the session ends', async () => {
    const first = await startSession('tick-game');
    await startGame(first.host);
    await dispatchGameAction(first.host, { type: 'finish' });
    const afterFinish = await getSessionSnapshot(first.code);
    await vi.advanceTimersByTimeAsync(TICK_MS * 5);
    expect(await getSessionSnapshot(first.code)).toMatchObject({ status: 'lobby', game: null, version: afterFinish?.version });

    const second = await startSession('tick-game');
    await startGame(second.host);
    await endSession(second.code, 'host-ended');
    await vi.advanceTimersByTimeAsync(TICK_MS * 5);
    expect(await getSessionSnapshot(second.code)).toBeNull();
  });
});

describe('game actions and notifications', () => {
  it('never lets a client send a system action, nor a timer action the game reserves for the system', async () => {
    const { host, player } = await startSession('tick-game');
    await startGame(host);
    await expect(dispatchGameAction(player, { type: 'system:participants-changed' })).rejects.toMatchObject({ code: 'INVALID_ACTION' });
    await expect(dispatchGameAction(host, { type: 'system:host-connection' })).rejects.toMatchObject({ code: 'INVALID_ACTION' });
    await expect(dispatchGameAction(player, { type: 'tick', payload: { seq: 0 } })).rejects.toThrow('only the system ticks');
    await expect(dispatchGameAction(player, null as never)).rejects.toMatchObject({ code: 'INVALID_ACTION' });
  });

  it('tells the running game about connection changes as the system', async () => {
    const { code, host, player } = await startSession('tick-game');
    await startGame(host);
    await setCredentialConnected(player, true);
    await setCredentialConnected(host, false);

    const welcome = await getSessionWelcome(host);
    expect(welcome?.gameView).toEqual({ secret: 'host-only', ticks: 0 });
    expect((await stateOf(code))?.notifications).toEqual(['system:system:participants-changed', 'system:system:host-connection']);
    await endSession(code, 'host-ended');
  });

  it('publishes the host view to the host channel and each private view to its own player only', async () => {
    const { code, host, participantId } = await startSession('tick-game');
    const hostViews: unknown[] = [];
    const privateViews: unknown[] = [];
    const unsubscribeHost = subscribeToChannel(sessionHostChannel(code), ({ event, payload }) => {
      if (event === SESSION_EVENTS.gameHost) hostViews.push(payload);
    });
    const unsubscribePlayer = subscribeToChannel(sessionParticipantChannel(code, participantId), ({ event, payload }) => {
      if (event === SESSION_EVENTS.gamePrivate) privateViews.push(payload);
    });

    await startGame(host);
    expect(hostViews.at(-1)).toEqual({ secret: 'host-only', ticks: 0 });
    expect(privateViews.at(-1)).toEqual({ me: participantId, ticks: 0 });
    const snapshot = (await getSessionSnapshot(code)) as SessionSnapshot;
    expect(JSON.stringify(snapshot)).not.toContain('host-only');

    unsubscribeHost();
    unsubscribePlayer();
    await endSession(code, 'host-ended');
  });
});

describe('starting a game', () => {
  it('hands prepare its result to createInitialState', async () => {
    prepareImpl = async () => ({ songs: 3 });
    const { code, host } = await startSession('prepared-game');
    await startGame(host);
    expect((await stateOf(code))?.prepared).toEqual({ songs: 3 });
    await endSession(code, 'host-ended');
  });

  it('turns an unexpected prepare failure into GAME_SETUP_FAILED and leaves the lobby as it was', async () => {
    prepareImpl = async () => {
      throw new Error('network down');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { code, host } = await startSession('prepared-game');
    await expect(startGame(host)).rejects.toMatchObject({ code: 'GAME_SETUP_FAILED' });
    expect((await getSessionSnapshot(code))?.status).toBe('lobby');
    spy.mockRestore();
    // A failed start doesn't leave the session stuck "starting".
    prepareImpl = async () => 'ok';
    await startGame(host);
    expect((await getSessionSnapshot(code))?.status).toBe('in-game');
    await endSession(code, 'host-ended');
  });

  it('refuses a second start while preparing, and a start whose settings changed underneath it', async () => {
    let release: (() => void) | undefined;
    prepareImpl = () => new Promise((resolve) => (release = () => resolve('slow')));
    const { code, host } = await startSession('prepared-game');

    const starting = startGame(host);
    await vi.waitFor(() => expect(release).toBeDefined());
    await expect(startGame(host)).rejects.toMatchObject({ code: 'GAME_STARTING' });
    // The lobby stays live while the game prepares.
    await updateGameSettings(host, { rounds: 5 });
    release?.();
    await expect(starting).rejects.toMatchObject({ code: 'INVALID_SETTINGS' });
    expect((await getSessionSnapshot(code))?.status).toBe('lobby');
    await endSession(code, 'host-ended');
  });

  it('gives up on a prepare that takes too long', async () => {
    vi.useFakeTimers();
    prepareImpl = () => new Promise(() => undefined);
    const { code, host } = await startSession('prepared-game');
    const starting = startGame(host);
    const assertion = expect(starting).rejects.toMatchObject({ code: 'GAME_SETUP_FAILED' });
    await vi.advanceTimersByTimeAsync(30 * 1000);
    await assertion;
    vi.useRealTimers();
    await endSession(code, 'host-ended');
  });

  it('refuses to start until a required integration resource is chosen', async () => {
    const { code, host } = await startSession('resource-game');
    await expect(startGame(host)).rejects.toMatchObject({ code: 'SETTING_REQUIRED', message: 'Choose a playlist first' });
    await updateGameSettings(host, { list: '37i9dQZF1DXcBWIGoYBM5M' });
    await startGame(host);
    await endSession(code, 'host-ended');
  });

  it("checks the host's requirements on pick and on start", async () => {
    const hosted = await hostSession('runtime-gated-host');
    const host: SessionCredential = { code: hosted.session.code, role: 'host', participantId: null };
    await joinSession(hosted.session.code, { name: 'Pat', userId: null, avatar: null });

    let blocked = true;
    setActiveRequirementEvaluator({
      name: 'test',
      evaluate: async (userId, requirements) =>
        blocked && userId === 'runtime-gated-host' ? [{ requirement: requirements[0], reason: 'Connect your Spotify account' }] : [],
    });

    await expect(selectGame(host, 'gated-game')).rejects.toMatchObject({
      code: 'REQUIREMENTS_NOT_MET',
      message: 'Connect your Spotify account',
      details: { requirement: { kind: 'integration', provider: 'spotify' } },
    });

    blocked = false;
    await selectGame(host, 'gated-game');
    blocked = true;
    await expect(startGame(host)).rejects.toMatchObject({ code: 'REQUIREMENTS_NOT_MET' });
    blocked = false;
    await startGame(host);
    await endSession(hosted.session.code, 'host-ended');
  });
});
