import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameCard } from './game-card.js';
import type { GameCatalogEntry } from './types.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

const GAME: GameCatalogEntry = {
  gameId: 'fishbowl',
  title: 'Fishbowl',
  description: 'A party game.',
  coverImageUrl: 'https://example.com/fishbowl.png',
  minPlayers: 4,
  maxPlayers: 16,
  defaultSettingsSchema: [],
};

describe('GameCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders the title, description, and player count', () => {
    act(() => {
      root.render(<GameCard game={GAME} actionLabel="Launch Session" onAction={vi.fn()} />);
    });
    expect(container.textContent).toContain('Fishbowl');
    expect(container.textContent).toContain('A party game.');
    expect(container.textContent).toContain('4');
    expect(container.textContent).toContain('16');
  });

  it('renders the given actionLabel and calls onAction with the game on click', () => {
    const onAction = vi.fn();
    act(() => {
      root.render(<GameCard game={GAME} actionLabel="Select" onAction={onAction} />);
    });

    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Select') as HTMLButtonElement;
    expect(button).toBeTruthy();

    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onAction).toHaveBeenCalledWith(GAME);
  });
});
