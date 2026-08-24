import type { SessionRosterPlayer } from '@jostle/messaging';

export interface PlayerListProps {
  readonly players: ReadonlyArray<SessionRosterPlayer>;
  readonly onKick?: (playerId: string) => void;
  readonly className?: string;
}
