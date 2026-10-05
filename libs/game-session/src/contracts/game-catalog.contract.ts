import type { GameSettingDefinition } from '@inithium/db';

// The slice of a catalogue record this lib needs to run the selection/settings/start flow.
// @inithium/db's GameEntity satisfies it structurally, but nothing here depends on Mongo.
export interface GameCatalogEntry {
  readonly slug: string;
  readonly title: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly settings: readonly GameSettingDefinition[];
}

// Swappable like GameSessionStore: apps/api wires the real (database-backed) catalogue in at boot
// via setGameCatalog, tests wire an in-memory one, and this lib never imports a database driver.
export interface GameCatalog {
  readonly name: string;
  // Resolves only games a host may pick - an unpublished or unknown game resolves to null.
  findGame: (gameId: string) => Promise<GameCatalogEntry | null>;
}
