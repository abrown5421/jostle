import { describe, expect, it } from 'vitest';
import type { SessionParticipant } from '../../contracts/session.contract';
import { isDuplicateClue, MAX_CLUE_LENGTH, normalizeClueKey, readClueText, shuffle } from './clues';
import { assignTeams, pickNextTurn, pickPresenter, removeMember } from './teams';
import type { FishbowlTeam } from './fishbowl.types';

const participant = (id: string, isConnected = true): SessionParticipant => ({
  id,
  name: id,
  userId: null,
  avatar: null,
  isConnected,
  joinedAt: '2026-01-01T00:00:00.000Z',
});

const team = (id: string, members: string[], presenterCursor = 0): FishbowlTeam => ({ id, name: id, color: 'red', members, presenterCursor });

describe('Fishbowl clues', () => {
  it('trims and collapses spacing, and refuses empty, non-text or overlong clues', () => {
    expect(readClueText({ text: '  The   Eiffel Tower ' })).toBe('The Eiffel Tower');
    expect(() => readClueText({ text: '   ' })).toThrow('Write a clue first');
    expect(() => readClueText({ text: 42 })).toThrow('Send your clue as text');
    expect(() => readClueText({ text: 'x'.repeat(MAX_CLUE_LENGTH + 1) })).toThrow(`at most ${MAX_CLUE_LENGTH}`);
    expect(readClueText({ text: 'x'.repeat(MAX_CLUE_LENGTH) })).toHaveLength(MAX_CLUE_LENGTH);
  });

  it('treats clues differing only in case or spacing as duplicates', () => {
    expect(normalizeClueKey(' Taylor   SWIFT ')).toBe('taylor swift');
    const clues = { c1: { id: 'c1', text: 'Taylor Swift', authorId: 'p1' } };
    expect(isDuplicateClue(clues, 'taylor  swift')).toBe(true);
    expect(isDuplicateClue(clues, 'Taylor Swifts')).toBe(false);
  });

  it('shuffles without losing or duplicating anything', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect([...shuffle(items, Math.random)].sort()).toEqual(items);
    expect(shuffle(items, () => 0.999999)).toEqual(items);
  });
});

describe('Fishbowl teams', () => {
  it('deals players into teams whose sizes differ by at most one', () => {
    const teams = assignTeams(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 3, Math.random);
    expect(teams.map(({ id, name }) => [id, name])).toEqual([
      ['team-1', 'Red'],
      ['team-2', 'Blue'],
      ['team-3', 'Green'],
    ]);
    expect(teams.map(({ members }) => members.length).sort()).toEqual([2, 2, 3]);
    expect(teams.flatMap(({ members }) => members).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('rotates presenters, passing over anyone disconnected', () => {
    const red = team('red', ['a', 'b', 'c']);
    const people = [participant('a'), participant('b', false), participant('c')];
    const first = pickPresenter(red, people);
    expect(first?.presenterId).toBe('a');
    const second = pickPresenter(first!.team, people);
    expect(second?.presenterId).toBe('c');
    expect(pickPresenter(second!.team, people)?.presenterId).toBe('a');
    expect(pickPresenter(red, [participant('a', false), participant('b', false), participant('c', false)])).toBeNull();
  });

  it('hands the next turn to the next team with someone connected, skipping empty teams', () => {
    const teams = [team('red', ['a']), team('blue', []), team('green', ['c'])];
    const people = [participant('a'), participant('c')];
    expect(pickNextTurn(teams, 1, people)).toMatchObject({ teamIndex: 2, presenterId: 'c' });
    expect(pickNextTurn(teams, 0, [participant('a', false), participant('c')])).toMatchObject({ teamIndex: 2, presenterId: 'c' });
    // Nobody connected anywhere: someone is still picked, so the game never stalls.
    expect(pickNextTurn(teams, 0, [])).toMatchObject({ teamIndex: 0, presenterId: 'a' });
    expect(pickNextTurn([team('red', [])], 0, [])).toBeNull();
  });

  it('removes a leaver without disturbing whose turn is next', () => {
    const [red] = removeMember([team('red', ['a', 'b', 'c'], 2)], 'a');
    expect(red).toMatchObject({ members: ['b', 'c'], presenterCursor: 1 });
    const [emptied] = removeMember([team('red', ['a'], 0)], 'a');
    expect(emptied).toMatchObject({ members: [], presenterCursor: 0 });
  });
});
