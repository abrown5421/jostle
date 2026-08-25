const timers = new Map<string, NodeJS.Timeout>();

export function scheduleTimer(sessionId: string, delayMs: number, callback: () => void): void {
  clearTimer(sessionId);
  const handle = setTimeout(() => {
    timers.delete(sessionId);
    callback();
  }, delayMs);
  timers.set(sessionId, handle);
}

export function clearTimer(sessionId: string): void {
  const existing = timers.get(sessionId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(sessionId);
  }
}
