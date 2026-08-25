import { listSessionPlayers } from '@jostle/game-sessions';
import type { IpodWarLeaderboardEntry } from '@jostle/messaging';
import { getCumulativeLeaderboard } from '../db/index.js';

export async function buildLeaderboard(sessionId: string): Promise<IpodWarLeaderboardEntry[]> {
  const [players, cumulative] = await Promise.all([
    listSessionPlayers(sessionId),
    getCumulativeLeaderboard(sessionId),
  ]);

  const pointsByPlayerId = new Map(cumulative.map((entry) => [entry.playerId, entry.totalPoints]));

  return players
    .map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      totalPoints: pointsByPlayerId.get(player.playerId) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
