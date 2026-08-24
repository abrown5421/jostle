import { useEffect, useState } from 'react';
import type { GameCatalogEntry, GamesClient } from './types.js';

export interface UseGameCatalogOptions {
  readonly client: GamesClient;
}

export interface UseGameCatalogResult {
  readonly games: ReadonlyArray<GameCatalogEntry>;
  readonly isLoading: boolean;
}

export function useGameCatalog(options: UseGameCatalogOptions): UseGameCatalogResult {
  const { client } = options;
  const [games, setGames] = useState<ReadonlyArray<GameCatalogEntry>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client.listGames().then((result) => {
      if (cancelled) return;
      setGames(result);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  return { games, isLoading };
}
