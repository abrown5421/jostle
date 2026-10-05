import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { alert, useNavigateWithTransition } from '@inithium/ui';
import {
  retainGameSession,
  useGameSession,
  useGetMyHostedSessionQuery,
  useHostGameSessionMutation,
} from '@inithium/api-client';
import type { GameSessionClientState, HostedSession, SessionSnapshot } from '@inithium/api-client';
import { useCurrentUser } from '../../app/useCurrentUser';
import { resolveRequirementPath } from '../games/requirements';

export interface UseHostSessionOptions {
  // /host creates the session if there isn't one; /games and /settings/:code only ever find an
  // existing one.
  readonly create?: boolean;
}

export interface UseHostSessionResult {
  readonly userId: string | undefined;
  readonly isResolvingUser: boolean;
  // True until we know whether this user has a session (and, with `create`, until it exists).
  readonly isLoading: boolean;
  readonly hosted: HostedSession | null;
  // The live snapshot once this device's host socket has been welcomed, else the REST snapshot.
  readonly session: SessionSnapshot | null;
  readonly live: GameSessionClientState;
  // The host socket is open and the server is listening - safe to send host:* messages.
  readonly isReady: boolean;
  readonly createError: unknown;
  readonly retryCreate: () => void;
}

// The one way every host-flow page (/host, /games, /settings/:code) attaches to the signed-in
// user's hosted session. The socket is *retained*, not connected/disconnected per page, so moving
// between those pages never drops the host connection (which would start the server's
// host-absence countdown). Also surfaces server-rejected host messages as alerts, so each page
// doesn't have to - except an unmet host requirement (e.g. Spotify disconnected since the game
// was picked), which sends the host to fix it instead.
export const useHostSession = ({ create = false }: UseHostSessionOptions = {}): UseHostSessionResult => {
  const { currentUser, isResolving } = useCurrentUser();
  const userId = currentUser?.id;
  const navigate = useNavigateWithTransition();
  const location = useLocation();

  const existing = useGetMyHostedSessionQuery(undefined, { skip: !userId || create, refetchOnMountOrArgChange: true });
  const [hostGameSession, created] = useHostGameSessionMutation();

  // Get-or-create server-side, so a refresh (or StrictMode's double effect) resumes the same
  // session instead of minting a new code.
  useEffect(() => {
    if (create && userId) void hostGameSession();
  }, [create, userId, hostGameSession]);

  // A cached lookup is ignored while its refetch is in flight - its token may belong to a session
  // that has since ended. (A brief null just releases the socket into its grace period.)
  const hosted = (create ? created.data : existing.isFetching ? null : existing.data) ?? null;
  const hostToken = hosted?.hostToken;
  useEffect(() => (hostToken ? retainGameSession(hostToken) : undefined), [hostToken]);

  const live = useGameSession();
  const isLive = live.role === 'host' && live.session?.code === hosted?.session.code;

  // Only errors that arrive while this page is mounted - not one left over from the last page.
  const alertedError = useRef(live.lastError);
  useEffect(() => {
    if (!live.lastError || live.lastError === alertedError.current) return;
    alertedError.current = live.lastError;
    if (live.lastError.code === 'REQUIREMENTS_NOT_MET' && userId) {
      alert.info(live.lastError.message, { position: 'bottom-right' });
      navigate(resolveRequirementPath(userId, `${location.pathname}${location.search}`));
      return;
    }
    alert.danger(live.lastError.message, { position: 'bottom-right' });
  }, [live.lastError, userId, navigate, location.pathname, location.search]);

  return {
    userId,
    isResolvingUser: isResolving,
    // Waits out the on-mount refetch rather than trusting a cached session that may have ended.
    isLoading: isResolving || (create ? !created.data && !created.error : Boolean(userId) && existing.isFetching),
    hosted,
    session: isLive ? live.session : (hosted?.session ?? null),
    live,
    isReady: isLive && live.status === 'open',
    createError: created.error,
    retryCreate: () => void hostGameSession(),
  };
};
