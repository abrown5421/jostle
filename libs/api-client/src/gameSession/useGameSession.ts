import { useSyncExternalStore } from 'react';
import { getGameSessionState, subscribeToGameSessionState } from './gameSessionClientStore';
import type { GameSessionClientState } from './gameSessionClientStore';

export const useGameSession = (): GameSessionClientState =>
  useSyncExternalStore(subscribeToGameSessionState, getGameSessionState, getGameSessionState);
