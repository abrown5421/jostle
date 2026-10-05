import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { attachGameSessionGateway } from './sessionGateway';
import { GAME_SESSION_CLOSE_CODES, GAME_SESSION_SOCKET_PATH } from './protocol';
import type { SessionServerMessage } from './protocol';
import type { SessionSnapshot } from '../contracts/session.contract';
import type { GameCatalogEntry } from '../contracts/game-catalog.contract';
import { setActiveGameCatalog } from '../catalog/catalog-registry';
import { hostSession, joinSession, MAX_PARTICIPANTS } from '../service/session.service';

// Catalogued but (like every real game today) with no GameDefinition - selectable and
// configurable, not startable.
const TEST_GAME: GameCatalogEntry = {
  slug: 'test-game',
  title: 'Test Game',
  minPlayers: 2,
  maxPlayers: 4,
  settings: [
    { key: 'rounds', label: 'Rounds', type: 'number', default: 3, min: 1, max: 10, step: 1 },
    { key: 'hardMode', label: 'Hard mode', type: 'boolean', default: false },
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'classic',
      options: [
        { value: 'classic', label: 'Classic' },
        { value: 'blitz', label: 'Blitz' },
      ],
    },
  ],
};

// End-to-end over real sockets and the real (in-memory) RealtimeProvider - the same path the
// browser takes, minus REST (the routes are thin wrappers over hostSession/joinSession).
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  setActiveGameCatalog({ name: 'test', findGame: async (gameId) => (gameId === TEST_GAME.slug ? TEST_GAME : null) });
  server = createServer();
  attachGameSessionGateway(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `ws://127.0.0.1:${(server.address() as AddressInfo).port}${GAME_SESSION_SOCKET_PATH}`;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

interface TestClient {
  readonly messages: SessionServerMessage[];
  readonly closed: Promise<number>;
  next: (predicate: (message: SessionServerMessage) => boolean) => Promise<SessionServerMessage>;
  send: (message: unknown) => void;
  close: () => void;
}

const connect = (token: string): Promise<TestClient> =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(`${baseUrl}?token=${encodeURIComponent(token)}`);
    const messages: SessionServerMessage[] = [];
    const waiters: Array<{ predicate: (m: SessionServerMessage) => boolean; resolve: (m: SessionServerMessage) => void }> = [];
    const closed = new Promise<number>((resolveClosed) => ws.on('close', (code) => resolveClosed(code)));

    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as SessionServerMessage;
      // Consumed by whoever's already waiting for it; otherwise buffered for a later next().
      const waiter = waiters.find((candidate) => candidate.predicate(message));
      if (waiter) {
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(message);
      } else {
        messages.push(message);
      }
    });
    ws.on('error', reject);
    ws.on('open', () =>
      resolve({
        messages,
        closed,
        next: (predicate) =>
          new Promise((resolveNext) => {
            const seen = messages.find(predicate);
            if (seen) {
              messages.splice(messages.indexOf(seen), 1);
              resolveNext(seen);
            } else {
              waiters.push({ predicate, resolve: resolveNext });
            }
          }),
        send: (message) => ws.send(JSON.stringify(message)),
        close: () => ws.close(),
      }),
    );
  });

const isWelcome = (message: SessionServerMessage) => message.type === 'welcome';
const snapshotWhere = (check: (session: SessionSnapshot) => boolean) => (message: SessionServerMessage) =>
  message.type === 'event' && message.event === 'session:updated' && check(message.payload as SessionSnapshot);

describe('game session gateway', () => {
  it('hosts without adding the host as a participant, and resumes the same session for the same host', async () => {
    const first = await hostSession('host-user-1');
    const second = await hostSession('host-user-1');

    expect(first.session.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(first.session.participants).toHaveLength(0);
    expect(second.session.code).toBe(first.session.code);
    expect(second.hostToken).toBe(first.hostToken);
  });

  it('broadcasts joins and connection state to the host, and lets the host account also join as a player', async () => {
    const { hostToken, session } = await hostSession('host-user-2');
    const host = await connect(hostToken);
    const welcome = await host.next(isWelcome);
    expect(welcome).toMatchObject({ role: 'host', participantId: null });

    const guest = await joinSession(session.code.toLowerCase(), { name: 'Guest', userId: null, avatar: null });
    // The host's own account joining from a second device gets a normal, separate seat.
    const hostAsPlayer = await joinSession(session.code, { name: 'Hosty', userId: 'host-user-2', avatar: null });
    expect(hostAsPlayer.participantId).not.toBe(guest.participantId);

    await host.next(snapshotWhere((s) => s.participants.length === 2));

    const player = await connect(guest.playerToken);
    expect(await player.next(isWelcome)).toMatchObject({ role: 'player', participantId: guest.participantId });
    await host.next(
      snapshotWhere((s) => s.participants.find((p) => p.id === guest.participantId)?.isConnected === true),
    );

    // Leaving the seat closes the player's socket with the terminal "removed" code.
    player.send({ type: 'leave' });
    expect(await player.closed).toBe(GAME_SESSION_CLOSE_CODES.removed);
    await host.next(snapshotWhere((s) => s.participants.length === 1));

    host.close();
  });

  it('rejects bad joins with typed errors', async () => {
    const { session } = await hostSession('host-user-3');
    await joinSession(session.code, { name: 'Sam', userId: null, avatar: null });

    await expect(joinSession('ZZZZZZ', { name: 'Sam', userId: null, avatar: null })).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
    await expect(joinSession(session.code, { name: '  sam ', userId: null, avatar: null })).rejects.toMatchObject({ code: 'NAME_TAKEN' });
    await expect(joinSession(session.code, { name: '   ', userId: null, avatar: null })).rejects.toMatchObject({ code: 'INVALID_NAME' });
    // Screen names are compared case-insensitively with whitespace collapsed.
    await joinSession(session.code, { name: 'Mary Jane', userId: null, avatar: null });
    await expect(joinSession(session.code, { name: ' MARY   jane', userId: null, avatar: null })).rejects.toMatchObject({
      code: 'NAME_TAKEN',
    });

    let seated = (await joinSession(session.code, { name: 'P0', userId: null, avatar: null })).session.participants.length;
    for (let i = 1; seated < MAX_PARTICIPANTS; i += 1) {
      seated = (await joinSession(session.code, { name: `P${i}`, userId: null, avatar: null })).session.participants.length;
    }
    await expect(joinSession(session.code, { name: 'Late', userId: null, avatar: null })).rejects.toMatchObject({ code: 'SESSION_FULL' });
  });

  it('lets a device reclaim its own seat and name with its rejoin token', async () => {
    const { session } = await hostSession('host-user-4');
    const original = await joinSession(session.code, { name: 'Alex', userId: null, avatar: null });
    const rejoined = await joinSession(session.code, { name: 'Alex', userId: null, avatar: null, rejoinToken: original.playerToken });

    expect(rejoined.participantId).toBe(original.participantId);
    expect(rejoined.session.participants).toHaveLength(1);
  });

  it('only lets the host kick or end, and closes everyone with the right codes', async () => {
    const { hostToken, session } = await hostSession('host-user-5');
    const a = await joinSession(session.code, { name: 'A', userId: null, avatar: null });
    const b = await joinSession(session.code, { name: 'B', userId: null, avatar: null });

    const host = await connect(hostToken);
    const playerA = await connect(a.playerToken);
    const playerB = await connect(b.playerToken);
    await Promise.all([host.next(isWelcome), playerA.next(isWelcome), playerB.next(isWelcome)]);

    playerA.send({ type: 'host:end' });
    expect(await playerA.next((m) => m.type === 'error')).toMatchObject({ code: 'NOT_AUTHORIZED' });

    host.send({ type: 'host:kick', participantId: a.participantId });
    expect(await playerA.next((m) => m.type === 'event' && m.event === 'participant:removed')).toMatchObject({
      payload: { reason: 'kicked' },
    });
    expect(await playerA.closed).toBe(GAME_SESSION_CLOSE_CODES.removed);

    // A kicked token no longer opens a socket.
    const ghost = await connect(a.playerToken);
    expect(await ghost.closed).toBe(GAME_SESSION_CLOSE_CODES.invalidToken);

    host.send({ type: 'host:end' });
    expect(await playerB.closed).toBe(GAME_SESSION_CLOSE_CODES.sessionEnded);
    expect(await host.closed).toBe(GAME_SESSION_CLOSE_CODES.sessionEnded);
    await expect(joinSession(session.code, { name: 'C', userId: null, avatar: null })).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('refuses game actions until a game exists, and starting until one is selected', async () => {
    const { hostToken } = await hostSession('host-user-6');
    const host = await connect(hostToken);
    await host.next(isWelcome);

    host.send({ type: 'game:action', action: { type: 'anything' } });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'NO_ACTIVE_GAME' });
    host.send({ type: 'host:start-game' });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'NO_GAME_SELECTED' });
    host.send({ type: 'host:select-game', gameId: 'nope' });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'GAME_NOT_FOUND' });
    host.send({ type: 'host:update-game-settings', settings: { rounds: 2 } });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'NO_GAME_SELECTED' });
    host.close();
  });

  it('selects and configures a game with validated settings, broadcasting each change to players', async () => {
    const { hostToken, session } = await hostSession('host-user-7');
    const first = await joinSession(session.code, { name: 'First', userId: null, avatar: null });
    const host = await connect(hostToken);
    const player = await connect(first.playerToken);
    await Promise.all([host.next(isWelcome), player.next(isWelcome)]);

    // Only the host picks.
    player.send({ type: 'host:select-game', gameId: TEST_GAME.slug });
    expect(await player.next((m) => m.type === 'error')).toMatchObject({ code: 'NOT_AUTHORIZED' });

    // Selecting fills in the catalogue defaults, and players see it too.
    host.send({ type: 'host:select-game', gameId: TEST_GAME.slug });
    const defaults = { rounds: 3, hardMode: false, mode: 'classic' };
    await host.next(snapshotWhere((s) => s.selection?.gameId === TEST_GAME.slug));
    const seenByPlayer = await player.next(snapshotWhere((s) => s.selection !== null));
    expect((seenByPlayer as { payload: SessionSnapshot }).payload.selection).toEqual({ gameId: TEST_GAME.slug, settings: defaults });

    host.send({ type: 'host:update-game-settings', settings: { rounds: 7, mode: 'blitz' } });
    await host.next(snapshotWhere((s) => s.selection?.settings['rounds'] === 7 && s.selection.settings['mode'] === 'blitz'));

    // Out of range, wrong type, unknown key, unknown option: each rejected whole, nothing applied.
    for (const settings of [{ rounds: 11 }, { rounds: 2.5 }, { hardMode: 'yes' }, { rounds: 4, bogus: 1 }, { mode: 'turbo' }]) {
      host.send({ type: 'host:update-game-settings', settings });
      expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'INVALID_SETTINGS' });
    }

    // Re-selecting the same game keeps the configured settings.
    host.send({ type: 'host:select-game', gameId: TEST_GAME.slug });
    host.send({ type: 'host:update-game-settings', settings: { hardMode: true } });
    const updated = await host.next(snapshotWhere((s) => s.selection?.settings['hardMode'] === true));
    expect((updated as { payload: SessionSnapshot }).payload.selection?.settings).toEqual({ rounds: 7, hardMode: true, mode: 'blitz' });

    // Player count is checked against the catalogue before playability.
    host.send({ type: 'host:start-game' });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'INVALID_PLAYER_COUNT' });
    await joinSession(session.code, { name: 'Second', userId: null, avatar: null });
    host.send({ type: 'host:start-game' });
    expect(await host.next((m) => m.type === 'error')).toMatchObject({ code: 'GAME_NOT_PLAYABLE' });

    host.send({ type: 'host:clear-game' });
    await player.next(snapshotWhere((s) => s.selection === null));

    host.close();
    player.close();
  });

  it('closes an unknown token with the invalid-token code instead of failing the upgrade', async () => {
    const stranger = await connect('not-a-real-token');
    expect(await stranger.closed).toBe(GAME_SESSION_CLOSE_CODES.invalidToken);
  });
});
