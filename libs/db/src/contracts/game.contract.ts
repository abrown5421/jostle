// The game catalogue: one record per game a host can pick, holding everything the catalogue page
// and the host's settings screen render (title, art, rules, player counts) plus the *shape* of the
// game's configurable settings. Gameplay itself is code - a GameDefinition in @inithium/game-session
// whose id matches this record's slug - so a game can be listed here before it's playable.

export const GAME_SETTING_TYPES = ['number', 'boolean', 'select'] as const;
export type GameSettingType = (typeof GAME_SETTING_TYPES)[number];

interface GameSettingBase {
  // Stable identifier the game's code reads its value by - never rename one a GameDefinition
  // already depends on.
  key: string;
  label: string;
  description?: string;
}

export interface GameSettingSelectOption {
  value: string;
  label: string;
}

// A discriminated union on `type` (same reasoning as settings.contract.ts's SettingEntity): the
// host's settings form picks its control from `type`, and @inithium/game-session validates every
// submitted value against the matching definition - neither needs per-game code.
export type GameSettingDefinition =
  | (GameSettingBase & {
      type: 'number';
      default: number;
      min: number;
      max: number;
      // Values must land on min + n*step. Defaults to 1.
      step?: number;
      // Display-only suffix ("seconds", "songs") - never part of the stored value.
      unit?: string;
    })
  | (GameSettingBase & { type: 'boolean'; default: boolean })
  | (GameSettingBase & { type: 'select'; default: string; options: GameSettingSelectOption[] });

export type GameSettingValue = number | boolean | string;
// Keyed by GameSettingDefinition.key.
export type GameSettingValues = Record<string, GameSettingValue>;

export interface GameRule {
  title: string;
  description: string;
}

export interface GameEntity {
  id: string;
  // Doubles as the game's id everywhere else: the session's selected gameId, the GameDefinition
  // id in @inithium/game-session, and the idempotency key for seeding.
  slug: string;
  title: string;
  // One line for the catalogue card; `description` is the longer pitch in the details view.
  tagline: string;
  description: string;
  // Root-relative path to an asset served by apps/web (e.g. /games/fishbowl-logo.png). Optional -
  // a game without art falls back to `icon` on a plain tile.
  imageUrl?: string;
  // A Phosphor icon name, same convention as PageNavigationConfig.icon.
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
  // Rough minutes for a typical game, shown on the card.
  estimatedMinutes?: number;
  tags: string[];
  rules: GameRule[];
  settings: GameSettingDefinition[];
  // Catalogue sort order (ascending), then title.
  order: number;
  // Bumped in a game's seed file whenever the seed changes. ensureSeededGames overwrites a stored
  // record with an older seedVersion, so seed edits reach databases that already have the game -
  // which also means a seed is the source of truth: hand-edits to a seeded record are replaced the
  // next time its seedVersion goes up.
  seedVersion: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateGameInput = Omit<GameEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGameInput = Partial<CreateGameInput>;

export interface GameRepository {
  findBySlug: (slug: string) => Promise<GameEntity | null>;
  findPublished: () => Promise<GameEntity[]>;
  create: (input: CreateGameInput) => Promise<GameEntity>;
  update: (id: string, input: UpdateGameInput) => Promise<GameEntity | null>;
}
