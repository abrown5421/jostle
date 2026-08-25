import { findUserById } from '@jostle/auth';
import { getSessionById, listSessionPlayers } from '@jostle/game-sessions';
import { getValidAccessToken } from '@jostle/integrations';
import { listUserPlaylists } from '@jostle/spotify';
import { SPOTIFY_PROVIDER_ID } from '../model/index.js';
import type { AggregatedPlaylistOption } from '../model/index.js';

interface PlaylistContributor {
  readonly userId: string;
  readonly playerId?: string;
  readonly displayName: string;
}

function buildDisplayName(firstName: string, lastName: string | undefined): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

async function resolveContributors(sessionId: string): Promise<PlaylistContributor[]> {
  const session = await getSessionById(sessionId);
  if (!session) return [];

  const contributors: PlaylistContributor[] = [];
  const seenUserIds = new Set<string>();

  const hostUser = await findUserById(session.hostUserId);
  if (hostUser) {
    contributors.push({
      userId: session.hostUserId,
      displayName: buildDisplayName(hostUser.firstName, hostUser.lastName),
    });
    seenUserIds.add(session.hostUserId);
  }

  const players = await listSessionPlayers(sessionId);
  for (const player of players) {
    if (!player.userId || seenUserIds.has(player.userId)) continue;
    contributors.push({
      userId: player.userId,
      playerId: player.playerId,
      displayName: player.displayName,
    });
    seenUserIds.add(player.userId);
  }

  return contributors;
}

export async function buildAggregatedPlaylistOptions(
  sessionId: string,
): Promise<AggregatedPlaylistOption[]> {
  const contributors = await resolveContributors(sessionId);
  const optionsByPlaylistId = new Map<string, AggregatedPlaylistOption>();

  await Promise.all(
    contributors.map(async (contributor) => {
      const accessToken = await getValidAccessToken(contributor.userId, SPOTIFY_PROVIDER_ID);
      if (!accessToken) return;

      const playlists = await listUserPlaylists(accessToken);
      for (const playlist of playlists) {
        if (optionsByPlaylistId.has(playlist.id)) continue;
        optionsByPlaylistId.set(playlist.id, {
          playlistId: playlist.id,
          name: playlist.name,
          imageUrl: playlist.imageUrl,
          trackCount: playlist.trackCount,
          contributedByUserId: contributor.userId,
          contributedByPlayerId: contributor.playerId,
          contributedByDisplayName: contributor.displayName,
        });
      }
    }),
  );

  return Array.from(optionsByPlaylistId.values());
}
