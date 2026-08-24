import { Avatar } from '@jostle/presence';
import { cn } from '@jostle/ui';
import { KickButton } from '../kick-button/index.js';
import type { PlayerListProps } from './types.js';

export function PlayerList({ players, onKick, className }: PlayerListProps) {
  if (players.length === 0) {
    return <p className={cn('text-sm text-content-tertiary', className)}>Waiting for players to join...</p>;
  }

  return (
    <ul className={cn('flex flex-col gap-3 w-full bg-surface-tertiary p-4', className)}>
      {players.map((player) => (
        <li key={player.playerId} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={player.displayName} imageUrl={player.avatarUrl} size="md" />
            <span className="text-sm font-medium text-content-primary">{player.displayName}</span>
          </div>
          {onKick && <KickButton onClick={() => onKick(player.playerId)} />}
        </li>
      ))}
    </ul>
  );
}
