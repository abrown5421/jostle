import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerList } from './player-list.js';
import type { SessionRosterPlayer } from '@jostle/messaging';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function player(playerId: string, displayName: string): SessionRosterPlayer {
  return { sessionId: 'session-1', playerId, userId: null, displayName };
}

describe('PlayerList', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows a waiting message when there are no players', () => {
    act(() => {
      root.render(<PlayerList players={[]} />);
    });
    expect(container.textContent).toContain('Waiting for players');
  });

  it("renders each player's display name", () => {
    act(() => {
      root.render(<PlayerList players={[player('1', 'Ada'), player('2', 'Bob')]} />);
    });
    expect(container.textContent).toContain('Ada');
    expect(container.textContent).toContain('Bob');
  });

  it('renders no kick controls when onKick is omitted', () => {
    act(() => {
      root.render(<PlayerList players={[player('1', 'Ada')]} />);
    });
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent === 'Kick')).toBe(false);
  });

  it('calls onKick with the right playerId when its kick button is clicked', () => {
    const onKick = vi.fn();
    act(() => {
      root.render(<PlayerList players={[player('1', 'Ada'), player('2', 'Bob')]} onKick={onKick} />);
    });

    const kickButtons = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent === 'Kick');
    expect(kickButtons).toHaveLength(2);
    act(() => kickButtons[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onKick).toHaveBeenCalledWith('2');
  });
});
