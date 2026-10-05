// Seats this device holds, keyed by session code. localStorage (not sessionStorage) on purpose:
// phones routinely kill a backgrounded tab, and a player coming back must reclaim their own seat
// rather than appear as a second, duplicate-named player.
const STORAGE_KEY = 'gameSession.playerCredentials';

export interface PlayerCredential {
  readonly participantId: string;
  readonly playerToken: string;
  readonly name: string;
}

const readAll = (): Record<string, PlayerCredential> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, PlayerCredential>;
  } catch {
    return {};
  }
};

const writeAll = (credentials: Record<string, PlayerCredential>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } catch {
    // Storage unavailable (private mode, quota) - the seat still works for this page's lifetime.
  }
};

export const getPlayerCredential = (code: string): PlayerCredential | null => readAll()[code] ?? null;

export const savePlayerCredential = (code: string, credential: PlayerCredential): void =>
  writeAll({ ...readAll(), [code]: credential });

export const clearPlayerCredential = (code: string): void => {
  const { [code]: _removed, ...rest } = readAll();
  writeAll(rest);
};
