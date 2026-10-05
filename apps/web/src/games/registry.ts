import type { ComponentType, ReactNode } from 'react';
import type {
  GameCatalogueItem,
  GameSessionConnectionStatus,
  GameSettingValues,
  SessionSnapshot,
} from '@inithium/api-client';

// A game action as the session protocol carries it - see @inithium/game-session's GameAction.
export interface WebGameAction {
  readonly type: string;
  readonly payload?: unknown;
}

// The shared host screen while the game runs (/host).
export interface HostStageProps {
  readonly session: SessionSnapshot;
  // The game's publicView (everyone) and hostView (this screen only), as the server sent them.
  readonly publicView: unknown;
  readonly hostView: unknown;
  readonly status: GameSessionConnectionStatus;
  // False when the socket isn't open (the action wasn't sent).
  readonly sendAction: (action: WebGameAction) => boolean;
}

// A player's own phone while the game runs (/play/:code).
export interface PlayerControllerProps {
  readonly session: SessionSnapshot;
  readonly publicView: unknown;
  readonly privateView: unknown;
  readonly participantId: string;
  readonly status: GameSessionConnectionStatus;
  readonly sendAction: (action: WebGameAction) => boolean;
}

export interface HostSetupArgs {
  readonly game: GameCatalogueItem;
  readonly settings: GameSettingValues;
}

// What a game needs from the host's browser before it can start (iPod War: a ready Spotify
// player), surfaced on /settings/:code.
export interface HostSetup {
  // Why Start is disabled, if the browser isn't ready.
  readonly startBlocker: string | null;
  // Runs inside the Start click, before the start message - e.g. unlocking audio, which browsers
  // only allow from a user gesture.
  readonly beforeStart?: () => void | Promise<void>;
  // Extra status shown above Start ("Audio: ready on this browser").
  readonly panel?: ReactNode;
}

export interface WebGameModule {
  // Must equal the game's catalogue slug.
  readonly id: string;
  readonly HostStage: ComponentType<HostStageProps>;
  readonly PlayerController: ComponentType<PlayerControllerProps>;
  // A hook, run while the host configures the game.
  readonly useHostSetup?: (args: HostSetupArgs) => HostSetup;
}

// A game's in-play UI is one folder here with an index.ts default-exporting a WebGameModule - the
// same drop-in convention as the profile tab registry. The host and player pages render whichever
// module matches the running game; neither knows any game by name.
const moduleFiles = import.meta.glob<WebGameModule>('./*/index.ts', { eager: true, import: 'default' });

const modules = new Map(Object.values(moduleFiles).map((module) => [module.id, module]));

export const getWebGameModule = (gameId: string): WebGameModule | undefined => modules.get(gameId);
