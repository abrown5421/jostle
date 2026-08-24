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

export interface GameDocument {
  readonly _id: string;
  readonly title: string;
  readonly description: string;
  readonly coverImageUrl: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly defaultSettingsSchema: ReadonlyArray<DynamicSettingFieldDefinition>;
}

export interface PublicGame extends Omit<GameDocument, '_id'> {
  readonly gameId: string;
}
