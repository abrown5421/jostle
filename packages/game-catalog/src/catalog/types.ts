export type DynamicSettingFieldType = 'number' | 'boolean' | 'select' | 'string';

export interface DynamicSettingFieldOption {
  readonly label: string;
  readonly value: string;
}

export interface DynamicSettingFieldDefinition {
  readonly key: string;
  readonly label: string;
  readonly type: DynamicSettingFieldType;
  readonly defaultValue: number | boolean | string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: ReadonlyArray<DynamicSettingFieldOption>;
}

export interface GameCatalogEntry {
  readonly gameId: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageUrl: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly defaultSettingsSchema: ReadonlyArray<DynamicSettingFieldDefinition>;
}

export interface GamesClient {
  readonly listGames: () => Promise<ReadonlyArray<GameCatalogEntry>>;
  readonly getGameById: (gameId: string) => Promise<GameCatalogEntry | null>;
}
