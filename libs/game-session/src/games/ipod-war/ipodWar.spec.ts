import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameContext } from '../../contracts/game-definition.contract';
import type { SessionParticipant } from '../../contracts/session.contract';
import { POINTS_PER_FIELD } from './grading';
import { ipodWarGame, setIpodWarRandomForTesting } from './ipodWar.game';
import { setIpodWarMusicSource } from './ipodWar.port';
import { COUNTDOWN_MS } from './ipodWar.reducer';
import type { IpodWarSettings, IpodWarState, IpodWarTrack } from './ipodWar.types';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const iso = (ms: number) => new Date(T0 + ms).toISOString();

const SETTINGS: IpodWarSettings = {
  playlistId: 'playlist1',
  songCount: 3,
  playbackSeconds: 30,
  endWhenAllAnswered: false,
  revealSeconds: 10,
  nameArtist: true,
  nameAlbum: false,
  difficulty: 5,
};

const track = (n: number, overrides: Partial<IpodWarTrack> = {}): IpodWarTrack => ({
  id: `t${n}`,
  uri: `spotify:track:t${n}`,
  title: `Song Number ${n}`,
  artists: [`Artist ${n}`, 'Featured Guest'],
  album: `Album ${n}`,
  albumImageUrl: `https://img/${n}`,
  durationMs: 200_000,
  ...overrides,
});

const TRACKS = [track(1), track(2), track(3), track(4)];
const PLAYLIST = { id: 'playlist1', name: 'Road Trip' };

const participant = (id: string, isConnected = true): SessionParticipant => ({
  id,
  name: id,
  userId: null,
  avatar: null,
  isConnected,
  joinedAt: iso(0),
});

let participants: SessionParticipant[];

const context = (role: 'host' | 'player' | 'system', at: number, participantId: string | null = null): GameContext => ({
  participants,
  actor: { role, participantId },
  now: iso(at),
});

const host = (state: IpodWarState, action: GameAction, at: number) => ipodWarGame.handleAction(state, action, context('host', at));
const system = (state: IpodWarState, action: GameAction, at: number) => ipodWarGame.handleAction(state, action, context('system', at));
const player = (state: IpodWarState, id: string, action: GameAction, at: number) =>
  ipodWarGame.handleAction(state, action, context('player', at, id));
const timer = (state: IpodWarState, at: number) => system(state, { type: 'timer', payload: { seq: state.timerSeq } }, at);

const create = (settings: Partial<IpodWarSettings> = {}): IpodWarState =>
  ipodWarGame.createInitialState(
    { participants, settings: { ...SETTINGS, ...settings }, now: iso(0), hostUserId: 'host-user' },
    { playlist: PLAYLIST, tracks: TRACKS },
  );

// Countdown -> loading -> the host screen reports the clip started at `at`.
const toPlaying = (state: IpodWarState, at: number): IpodWarState => {
  const loading = state.phase === 'countdown' ? timer(state, COUNTDOWN_MS).state : state;
  expect(loading.phase).toBe('loading');
  const playing = host(loading, { type: 'playback-started', payload: { index: loading.index, attempt: loading.playback.attempt } }, at).state;
  expect(playing.phase).toBe('playing');
  return playing;
};

const currentSong = (state: IpodWarState) => state.songs[state.index];

beforeEach(() => {
  participants = [participant('p1'), participant('p2'), participant('p3')];
  // Identity shuffle, clip offsets at the very start.
  setIpodWarRandomForTesting(() => 0.999999);
});

afterEach(() => {
  setIpodWarRandomForTesting(Math.random);
});

describe('iPod War setup', () => {
  it('refuses a playlist with fewer playable songs than the bank needs', async () => {
    setIpodWarMusicSource({ name: 'fake', loadPlaylist: async () => ({ playlist: PLAYLIST, tracks: TRACKS.slice(0, 2) }) });
    const prepare = ipodWarGame.prepare!;
    const setup = { participants, settings: SETTINGS, now: iso(0), hostUserId: 'h', signal: new AbortController().signal };
    await expect(prepare(setup)).rejects.toMatchObject({
      code: 'INVALID_SETTINGS',
      message: '"Road Trip" only has 2 playable songs - lower Songs to 2 or pick a bigger playlist',
    });
    setIpodWarMusicSource({ name: 'fake', loadPlaylist: async () => ({ playlist: PLAYLIST, tracks: TRACKS }) });
    await expect(prepare(setup)).resolves.toMatchObject({ tracks: TRACKS });
  });

  it('draws a bank of songCount songs, each clip fitting inside its song', () => {
    setIpodWarRandomForTesting(() => 0.5);
    const state = create({ songCount: 3 });
    expect(state.songs).toHaveLength(3);
    expect(new Set(state.songs.map(({ id }) => id)).size).toBe(3);
    state.songs.forEach((song) => {
      expect(song.clipStartMs).toBeGreaterThanOrEqual(0);
      expect(song.clipStartMs + 30_000).toBeLessThanOrEqual(song.durationMs);
    });
    // A song shorter than the clip plays from the top.
    const short = ipodWarGame.createInitialState(
      { participants, settings: { ...SETTINGS, songCount: 1 }, now: iso(0), hostUserId: 'h' },
      { playlist: PLAYLIST, tracks: [track(9, { durationMs: 20_000 })] },
    );
    expect(short.songs[0].clipStartMs).toBe(0);
  });

  it('starts with a countdown, everyone on the roster, and only the enabled answer fields', () => {
    const state = create({ nameArtist: false, nameAlbum: true });
    expect(state).toMatchObject({ phase: 'countdown', phaseEndsAt: iso(COUNTDOWN_MS), roster: ['p1', 'p2', 'p3'] });
    expect(state.config.fields).toEqual(['title', 'album']);
    expect(ipodWarGame.nextTimeout!(state)).toEqual({ at: iso(COUNTDOWN_MS), action: { type: 'timer', payload: { seq: 0 } } });
  });
});

describe('iPod War round flow', () => {
  it('plays a song, grades lock-ins with the speed bonus, reveals, then moves on', () => {
    let state = toPlaying(create(), 6_000);
    expect(state.phaseEndsAt).toBe(iso(36_000));
    const song = currentSong(state);

    // p1: right title + artist, 6s into a 30s clip -> bonus round(50 * 0.8) = 40 per field.
    state = player(state, 'p1', { type: 'submit', payload: { title: song.title.toUpperCase(), artist: 'featured guest' } }, 12_000).state;
    // p2: right title only, at the very end.
    state = player(state, 'p2', { type: 'submit', payload: { title: song.title, artist: 'nobody' } }, 36_000).state;
    expect(state.phase).toBe('playing');

    const ended = timer(state, 36_000);
    expect(ended.state.phase).toBe('reveal');
    expect(ended.scoreDeltas).toEqual({ p1: 2 * (POINTS_PER_FIELD + 40), p2: POINTS_PER_FIELD });
    expect(ended.state.totals).toEqual({ p1: 280, p2: 100, p3: 0 });
    expect(ended.state.phaseEndsAt).toBe(iso(46_000));

    const next = timer(ended.state, 46_000).state;
    expect(next).toMatchObject({ phase: 'loading', index: 1, submissions: {} });
  });

  it('finishes after the last song and only then lets the host go back to the lobby', () => {
    let state = create({ songCount: 3 });
    for (let song = 0; song < 3; song += 1) {
      state = toPlaying(state, 0);
      state = timer(state, 30_000).state;
      expect(state.phase).toBe('reveal');
      expect(() => host(state, { type: 'back-to-lobby' }, 0)).toThrow(expect.objectContaining({ code: 'INVALID_ACTION' }));
      state = timer(state, 40_000).state;
    }
    expect(state.phase).toBe('final');
    expect(ipodWarGame.nextTimeout!(state)).toBeNull();
    expect(host(state, { type: 'back-to-lobby' }, 0).complete).toBe(true);
  });

  it('refuses a second lock-in, lock-ins outside the clip, and anyone not in the game', () => {
    const counting = create();
    expect(() => player(counting, 'p1', { type: 'submit', payload: { title: 'x' } }, 0)).toThrow('Answers are closed');

    const state = toPlaying(counting, 6_000);
    const once = player(state, 'p1', { type: 'submit', payload: { title: 'x' } }, 7_000).state;
    expect(() => player(once, 'p1', { type: 'submit', payload: { title: 'y' } }, 8_000)).toThrow("You've already locked in");
    expect(() => player(once, 'stranger', { type: 'submit', payload: { title: 'y' } }, 8_000)).toThrow("You're not in this game");
    expect(() => player(once, 'p2', { type: 'submit', payload: { title: 42 } }, 8_000)).toThrow('must be text');
  });

  it('ends early once every connected player is in, when that setting is on', () => {
    participants = [participant('p1'), participant('p2'), participant('p3', false)];
    let state = toPlaying(create({ endWhenAllAnswered: true }), 0);
    state = player(state, 'p1', { type: 'submit', payload: { title: 'a' } }, 1_000).state;
    expect(state.phase).toBe('playing');
    // p3 is disconnected, so p2 is the last one anyone's waiting on.
    const result = player(state, 'p2', { type: 'submit', payload: { title: 'b' } }, 2_000);
    expect(result.state.phase).toBe('reveal');
    expect(Object.keys(result.scoreDeltas ?? {})).toEqual(['p1', 'p2']);
  });

  it('plays out the full clip when ending early is off', () => {
    let state = toPlaying(create({ endWhenAllAnswered: false }), 0);
    ['p1', 'p2', 'p3'].forEach((id) => {
      state = player(state, id, { type: 'submit', payload: { title: 'a' } }, 1_000).state;
    });
    expect(state.phase).toBe('playing');
  });

  it('ignores a stale timer and a playback report for an earlier attempt', () => {
    const playing = toPlaying(create(), 0);
    const skipped = host(playing, { type: 'skip' }, 5_000).state;
    expect(skipped.phase).toBe('reveal');
    // The clip's own timer, already in flight when the host skipped.
    expect(system(skipped, { type: 'timer', payload: { seq: playing.timerSeq } }, 30_000).state).toBe(skipped);

    const loading = timer(skipped, 15_000).state;
    const retried = host(loading, { type: 'retry-playback' }, 15_500).state;
    const stale = { type: 'playback-started', payload: { index: loading.index, attempt: loading.playback.attempt } };
    expect(host(retried, stale, 16_000).state).toBe(retried);
  });

  it('never lets a host or player fire the timer or system notifications', () => {
    const state = create();
    expect(() => player(state, 'p1', { type: 'timer', payload: { seq: 0 } }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => host(state, { type: 'timer', payload: { seq: 0 } }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => player(state, 'p1', { type: 'skip' }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => host(state, { type: 'submit', payload: {} }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
  });
});

describe('iPod War host controls', () => {
  it('freezes the clock on pause, keeps lock-in timing honest, and resumes with the time that was left', () => {
    let state = toPlaying(create(), 0);
    state = host(state, { type: 'pause' }, 10_000).state;
    expect(state).toMatchObject({ paused: true, phaseEndsAt: null, pausedRemainingMs: 20_000 });
    expect(ipodWarGame.nextTimeout!(state)).toBeNull();
    expect(() => player(state, 'p1', { type: 'submit', payload: { title: 'x' } }, 11_000)).toThrow('The game is paused');

    const attempt = state.playback.attempt;
    state = host(state, { type: 'resume' }, 100_000).state;
    expect(state).toMatchObject({ paused: false, phaseEndsAt: iso(120_000) });
    // The host screen re-seeks and resumes the clip.
    expect(state.playback.attempt).toBe(attempt + 1);

    // 5s after resuming is 15s into the clip, however long the pause was.
    state = player(state, 'p1', { type: 'submit', payload: { title: currentSong(state).title } }, 105_000).state;
    expect(state.submissions['p1'].grade.elapsedMs).toBe(15_000);
  });

  it('skips: a clip straight to its reveal (scoring lock-ins), a reveal straight to the next song', () => {
    let state = toPlaying(create(), 0);
    state = player(state, 'p1', { type: 'submit', payload: { title: currentSong(state).title } }, 3_000).state;
    const skipped = host(state, { type: 'skip' }, 4_000);
    expect(skipped.state.phase).toBe('reveal');
    expect(skipped.state.results.at(-1)).toMatchObject({ skipped: true });
    expect(skipped.scoreDeltas?.['p1']).toBeGreaterThan(0);
    expect(host(skipped.state, { type: 'skip' }, 5_000).state).toMatchObject({ phase: 'loading', index: 1 });
  });

  it('ends the game early without scoring the song in progress', () => {
    let state = toPlaying(create(), 0);
    state = player(state, 'p1', { type: 'submit', payload: { title: currentSong(state).title } }, 3_000).state;
    const ended = host(state, { type: 'end' }, 4_000);
    expect(ended.state.phase).toBe('final');
    expect(ended.scoreDeltas).toBeUndefined();
    expect(ended.state.totals['p1']).toBe(0);
  });

  it('pauses itself when the host screen drops, and waits for the host to resume', () => {
    const state = toPlaying(create(), 0);
    const dropped = system(state, { type: SYSTEM_ACTIONS.hostConnection, payload: { connected: false } }, 10_000).state;
    expect(dropped).toMatchObject({ paused: true, autoPaused: true, pausedRemainingMs: 20_000 });
    expect(system(dropped, { type: SYSTEM_ACTIONS.hostConnection, payload: { connected: true } }, 20_000).state).toBe(dropped);
  });

  it('pauses the clip when the host screen reports playback failed, and resumes on retry', () => {
    const state = toPlaying(create(), 0);
    const report = { index: state.index, attempt: state.playback.attempt, message: 'Device went away' };
    const failed = host(state, { type: 'playback-failed', payload: report }, 10_000).state;
    expect(failed).toMatchObject({ paused: true, playback: { error: 'Device went away' } });
    const retried = host(failed, { type: 'retry-playback' }, 30_000).state;
    expect(retried).toMatchObject({ paused: false, phaseEndsAt: iso(50_000), playback: { error: null } });
  });

  it('drops a player who leaves from the roster, and stops waiting on them', () => {
    let state = toPlaying(create({ endWhenAllAnswered: true }), 0);
    state = player(state, 'p1', { type: 'submit', payload: { title: 'a' } }, 1_000).state;
    state = player(state, 'p2', { type: 'submit', payload: { title: 'b' } }, 1_000).state;
    participants = participants.filter(({ id }) => id !== 'p3');
    const result = system(state, { type: SYSTEM_ACTIONS.participantsChanged }, 2_000);
    expect(result.state.roster).toEqual(['p1', 'p2']);
    expect(result.state.phase).toBe('reveal');
  });
});

describe('iPod War views', () => {
  const secretsOf = (state: IpodWarState) => {
    const song = currentSong(state);
    return [song.uri, song.title, song.album, song.artists[0], song.albumImageUrl!];
  };

  it('never shows players anything identifying the song before its reveal', () => {
    let state = create();
    const check = () => {
      const visibleToPlayers = JSON.stringify([ipodWarGame.publicView!(state), ...['p1', 'p2'].map((id) => ipodWarGame.privateView!(state, id))]);
      secretsOf(state).forEach((secret) => expect(visibleToPlayers).not.toContain(secret));
    };
    check();
    state = timer(state, COUNTDOWN_MS).state;
    check();
    state = toPlaying(state, 6_000);
    state = player(state, 'p1', { type: 'submit', payload: { title: 'guess' } }, 7_000).state;
    check();
    state = host(state, { type: 'pause' }, 8_000).state;
    check();

    // ...while the host screen has what it needs to play it.
    expect(ipodWarGame.hostView!(state)).toMatchObject({ song: { uri: currentSong(state).uri, clipStartMs: currentSong(state).clipStartMs } });
  });

  it('reveals the answer, standings and each player their own result', () => {
    let state = toPlaying(create(), 0);
    const song = currentSong(state);
    state = player(state, 'p1', { type: 'submit', payload: { title: song.title, artist: 'wrong' } }, 0).state;
    state = player(state, 'p2', { type: 'submit', payload: { title: 'wrong', artist: 'wrong' } }, 0).state;
    state = timer(state, 30_000).state;

    expect(ipodWarGame.publicView!(state)).toMatchObject({
      phase: 'reveal',
      answer: { title: song.title, artists: song.artists, album: song.album },
      standings: [
        { participantId: 'p1', total: 150, delta: 150, rank: 1 },
        { participantId: 'p2', total: 0, delta: 0, rank: 2 },
        { participantId: 'p3', total: 0, delta: 0, rank: 2 },
      ],
    });
    expect(ipodWarGame.privateView!(state, 'p1')).toMatchObject({
      result: {
        fields: {
          title: { guess: song.title, answer: song.title, correct: true, points: 150 },
          artist: { guess: 'wrong', answer: song.artists.join(', '), correct: false, points: 0 },
        },
        speedBonus: 50,
        points: 150,
      },
      total: 150,
      rank: 1,
      playerCount: 3,
    });
    // p3 never locked in - nothing to show, but still ranked.
    expect(ipodWarGame.privateView!(state, 'p3')).toMatchObject({ result: null, rank: 2 });
  });

  it("never shows a player anyone else's guesses", () => {
    let state = toPlaying(create(), 0);
    state = player(state, 'p1', { type: 'submit', payload: { title: 'p1-secret-guess' } }, 1_000).state;
    expect(JSON.stringify(ipodWarGame.privateView!(state, 'p2'))).not.toContain('p1-secret-guess');
    expect(JSON.stringify(ipodWarGame.publicView!(state))).not.toContain('p1-secret-guess');
    state = timer(state, 30_000).state;
    expect(JSON.stringify(ipodWarGame.privateView!(state, 'p2'))).not.toContain('p1-secret-guess');
    expect(JSON.stringify(ipodWarGame.publicView!(state))).not.toContain('p1-secret-guess');
  });
});
