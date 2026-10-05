// ISO-timestamp arithmetic for game deadlines (GameContext.now is an ISO string).
export const addMs = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();

// Never negative - a deadline already passed has nothing left.
export const msUntil = (iso: string, now: string): number => Math.max(0, Date.parse(iso) - Date.parse(now));
