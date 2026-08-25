import { Avatar } from '@jostle/ui';

export interface AvatarClusterPlayer {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly submitted: boolean;
}

export interface AvatarClusterProps {
  readonly players: ReadonlyArray<AvatarClusterPlayer>;
  readonly radius: number;
  readonly avatarSize?: number;
}

const DEFAULT_AVATAR_PIXEL_SIZE = 36;

function SubmittedIndicator() {
  return (
    <span className="block h-3 w-3 rounded-full bg-status-online ring-2 ring-surface-primary" />
  );
}

export function AvatarCluster({
  players,
  radius,
  avatarSize = DEFAULT_AVATAR_PIXEL_SIZE,
}: AvatarClusterProps) {
  return (
    <>
      {players.map((player, index) => {
        const angle = (index / Math.max(1, players.length)) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <div
            key={player.playerId}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(${x - avatarSize / 2}px, ${y - avatarSize / 2}px)`,
              transition: 'transform 300ms ease',
            }}
          >
            <Avatar
              imageUrl={player.avatarUrl}
              name={player.displayName}
              size="sm"
              statusIndicator={player.submitted ? <SubmittedIndicator /> : undefined}
            />
          </div>
        );
      })}
    </>
  );
}
