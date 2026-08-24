import type { ActivityEventName, IdleChangeListener, IdleTracker, IdleTrackerOptions } from './types.js';

export const DEFAULT_ACTIVITY_EVENTS: ReadonlyArray<ActivityEventName> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
];

export function createIdleTracker(options: IdleTrackerOptions): IdleTracker {
  const target = options.target ?? (typeof window !== 'undefined' ? window : undefined);
  const activityEvents = options.activityEvents ?? DEFAULT_ACTIVITY_EVENTS;
  const listeners = new Set<IdleChangeListener>();
  let isIdle = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const notify = (): void => {
    for (const listener of listeners) listener(isIdle);
  };

  const setIdle = (next: boolean): void => {
    if (next === isIdle) return;
    isIdle = next;
    notify();
  };

  const scheduleIdle = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setIdle(true), options.thresholdMs);
  };

  const handleActivity = (): void => {
    setIdle(false);
    scheduleIdle();
  };

  for (const event of activityEvents) {
    target?.addEventListener(event, handleActivity, { passive: true });
  }
  scheduleIdle();

  const subscribe = (listener: IdleChangeListener): (() => void) => {
    listeners.add(listener);
    listener(isIdle);
    return () => {
      listeners.delete(listener);
    };
  };

  const dispose = (): void => {
    if (timer) clearTimeout(timer);
    for (const event of activityEvents) {
      target?.removeEventListener(event, handleActivity);
    }
    listeners.clear();
  };

  return { subscribe, dispose };
}
