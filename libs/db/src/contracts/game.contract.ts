// The game catalogue: one record per game a host can pick, holding everything the catalogue page
// and the host's settings screen render (title, art, rules, player counts) plus the *shape* of the
// game's configurable settings. Gameplay itself is code - a GameDefinition in @inithium/game-session
// whose id matches this record's slug - so a game can be listed here before it's playable.

export const GAME_SETTING_TYPES = ['number', 'boolean', 'select', 'integration-resource'] as const;
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
  | (GameSettingBase & { type: 'select'; default: string; options: GameSettingSelectOption[] })
  // Something the host owns in a connected integration (iPod War: one of their Spotify playlists).
  // The stored value is the resource's id at that provider, '' while nothing is chosen. Which ids
  // are valid depends on the host's own account, so only the id's *format* is checked when it's
  // set - the game resolves (and so verifies) it against the provider when it starts.
  | (GameSettingBase & {
      type: 'integration-resource';
      default: string;
      // An integration provider id (@inithium/integrations), e.g. 'spotify'.
      provider: string;
      // Which of that provider's resource lists to pick from, e.g. 'playlist'.
      resource: string;
      // When true the game can't start until something is chosen.
      required?: boolean;
      // The key of a number setting whose value is the fewest items the chosen resource must hold
      // (iPod War: a playlist needs at least `songCount` songs) - smaller ones aren't selectable.
      minItemsFromSetting?: string;
    });

export type GameSettingValue = number | boolean | string;
// Keyed by GameSettingDefinition.key.
export type GameSettingValues = Record<string, GameSettingValue>;

// Something a *host* must have before they can host a game - checked per user when the catalogue
// is listed (so the card can explain itself) and again, authoritatively, when the game is picked
// and started. Players never need anything. A union on `kind` so new kinds of requirement slot in
// without touching existing ones.
export const GAME_REQUIREMENT_KINDS = ['integration'] as const;
export type GameRequirementKind = (typeof GAME_REQUIREMENT_KINDS)[number];

export interface IntegrationGameRequirement {
  kind: 'integration';
  // An integration provider id (@inithium/integrations), e.g. 'spotify'.
  provider: string;
  // Provider-defined capabilities the connected account must have, e.g. Spotify's 'playback'
  // (Premium). Omitted -> any healthy connection will do.
  capabilities?: string[];
}

export type GameRequirement = IntegrationGameRequirement;

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
  // What a host needs before they can host this game. Empty for most games.
  requirements: GameRequirement[];
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
