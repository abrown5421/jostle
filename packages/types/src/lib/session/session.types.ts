export type GameType = 'ipod-war' | 'color-match' | 'fishbowl';

export type SessionStatus =
  | 'lobby'
  | 'game-select'
  | 'settings'
  | 'in-progress'
  | 'completed';

export interface SessionPlayer {
  player_id: string;
  user_id?: string;
  display_name: string;
  avatar_color?: string;
  score: number;
  connected: boolean;
  is_host: boolean;
}

export interface IpodWarSettings {
  game_type: 'ipod-war';
  source: 'spotify' | 'apple-music';
  rounds: number;
  clip_duration_seconds: number;
}

export interface ColorMatchSettings {
  game_type: 'color-match';
  rounds: number;
  round_duration_seconds: number;
}

export interface FishbowlSettings {
  game_type: 'fishbowl';
  words_per_player: number;
  round_duration_seconds: number;
  team_count: number;
}

export type GameSettings = IpodWarSettings | ColorMatchSettings | FishbowlSettings;

export interface GameSession {
  _id: string;
  join_code: string;
  host_id: string;
  status: SessionStatus;
  game_type?: GameType;
  players: readonly SessionPlayer[];
  settings?: GameSettings;
  game_state?: unknown;
  started_at?: string;
  ended_at?: string;
}