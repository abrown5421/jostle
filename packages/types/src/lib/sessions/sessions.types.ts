import type { GameSetting } from '../game/game.types.js';
import { User } from '../user/user.types.js';

export type SessionStatus = 'configuring' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface SessionPlayer {
  playerId: string;
  registeredUser?: User;
  displayName: string;
  secret?: string;
  joinedAt: Date;
  isHost: boolean;
  isConnected: boolean;
}

export interface SessionTeam {
  id: string;
  name: string;
  color?: string;
  playerIds: string[];
}

export interface RoundScore {
  roundIndex: number;
  points: number;
  meta?: Record<string, unknown>;
}

export interface PlayerScore {
  playerId: string;
  roundScores: RoundScore[];
  totalPoints: number;
}

export interface TeamScore {
  teamId: string;
  roundScores: RoundScore[];
  totalPoints: number;
}

export interface SessionConfigSnapshot {
  gameId: string;
  gameKey: string;
  gameName: string;
  settings: (GameSetting & { value: string | number | boolean })[];
}

export interface BaseGameState {
  game: string;
  phase: string;
  [key: string]: unknown;
}

export interface Session<TGameState extends BaseGameState = BaseGameState> {
  _id: string;
  lobbyId: string;
  hostId: string;
  config: SessionConfigSnapshot;
  players: SessionPlayer[];
  teams: SessionTeam[];
  playerScores: PlayerScore[];
  teamScores: TeamScore[];
  gameState: TGameState;
  status: SessionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  winnerId: string | null;
  winnerTeamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}