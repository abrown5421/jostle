import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameCatalog } from './use-game-catalog.js';
import type { GameCatalogEntry, GamesClient } from './types.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function game(gameId: string, title: string): GameCatalogEntry {
  return { gameId, title, description: '', coverImageUrl: '', minPlayers: 1, maxPlayers: 1, defaultSettingsSchema: [] };
}

describe('useGameCatalog', () => {
  let container: HTMLDivElement;
  let root: Root;

  function Probe({ client }: { client: GamesClient }) {
    const { games, isLoading } = useGameCatalog({ client });
    return (
      <span data-testid="result">{isLoading ? 'loading' : games.map((g) => g.gameId).join(',')}</span>
    );
  }

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function text() {
    return container.querySelector('[data-testid="result"]')?.textContent;
  }

  it('starts in a loading state', () => {
    const client: GamesClient = {
      listGames: vi.fn(() => new Promise<readonly GameCatalogEntry[]>(() => {})),
      getGameById: vi.fn(),
    };
    act(() => {
      root.render(<Probe client={client} />);
    });
    expect(text()).toBe('loading');
  });

  it('populates games from the client after the fetch resolves', async () => {
    const client: GamesClient = {
      listGames: vi.fn().mockResolvedValue([game('fishbowl', 'Fishbowl'), game('ipod-war', 'iPod War')]),
      getGameById: vi.fn(),
    };
    await act(async () => {
      root.render(<Probe client={client} />);
    });
    expect(text()).toBe('fishbowl,ipod-war');
  });
});
