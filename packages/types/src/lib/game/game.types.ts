export type GameStatus = 'active' | 'inactive' | 'coming_soon';
export type GameCategory = 'music' | 'trivia' | 'drawing' | 'word' | 'social' | 'party';
export type GameSettingType = 'boolean' | 'number' | 'select' | 'range';

export interface GameSettingOption {
  label: string;
  value: string | number | boolean;
}

export interface GameSetting {
  key:string;
  label:string;
  description?: string;
  type: GameSettingType;
  default: string | number | boolean;
  options?: GameSettingOption[];
  min?: number;
  max?: number;
  step?:number;
  required: boolean;
}

export interface GameRequiredAccount {
  provider: string;
  label:string;
  isPremium?: boolean;
  description?: string;
}

export interface Game {
  _id: string;
  key: string;
  name: string;
  description:string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: number;
  thumbnailAsset?: string;
  bannerAsset?: string;
  settings: GameSetting[];
  requiredAccounts: GameRequiredAccount[];
  status: GameStatus;
  version:string;
  isOfficial: boolean;
  createdBy?: string | null;
  tags: string[];
  createdAt:Date;
  updatedAt:Date;
}