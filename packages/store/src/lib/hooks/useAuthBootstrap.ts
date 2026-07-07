import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  setActiveUser,
  clearActiveUser,
  setBootstrappingComplete,
} from '../features/active-user/active-user-slice';
import { useRefreshMutation } from '../features/auth/auth-api';
import { AppDispatch } from '../../store';

const REFRESH_INTERVAL_MS  = 14 * 60 * 1000;

const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const origin = import.meta.env['VITE_API_ORIGIN'];
    return origin ? `${origin}/api` : 'http://localhost:3000/api';
  }
  return 'http://localhost:3000/api';
};

const fetchCurrentUser = async () => {
  const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json();
};

export const useAuthBootstrap = () => {
  const dispatch     = useDispatch<AppDispatch>();
  const [refresh]    = useRefreshMutation();
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleRefresh = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        await refresh().unwrap();
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
        dispatch(clearActiveUser());
        window.location.href = '/auth/login';
      }
    }, REFRESH_INTERVAL_MS);
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchCurrentUser();
        dispatch(setActiveUser(user));
        scheduleRefresh();
      } catch {
        dispatch(clearActiveUser());
      } finally {
        dispatch(setBootstrappingComplete());
      }
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
};