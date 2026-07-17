import type { AccessTokenPayload } from '@inithium/types';
import { sessionsService } from './sessions.service.js';

const parseSessionChannel = (channel: string): { lobbyId: string; playerId: string | null } | null => {
  const match = channel.match(/^session:([A-Z0-9]+)(?::player:(.+))?$/);
  if (!match) return null;
  return { lobbyId: match[1], playerId: match[2] ?? null };
};

export const canJoinSessionChannel = async (user: AccessTokenPayload, channel: string): Promise<boolean> => {
  const parsed = parseSessionChannel(channel);
  if (!parsed) return false;

  const session = await sessionsService.findByLobbyId(parsed.lobbyId);
  if (!session) return false;

  const subject = (user as any).sub as string | undefined;
  if (!subject) return false;

  const isHost = session.hostId === subject;
  const isPlayerInSession = session.players.some((p) => p.playerId === subject);

  if (!isHost && !isPlayerInSession) return false;

  if (parsed.playerId) {
    return isHost || parsed.playerId === subject;
  }

  return true;
};