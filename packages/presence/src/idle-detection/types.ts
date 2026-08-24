export type ActivityEventName = 'mousemove' | 'mousedown' | 'keydown' | 'touchstart' | 'scroll' | 'wheel';

export type IdleChangeListener = (isIdle: boolean) => void;

export interface IdleTrackerOptions {
  readonly thresholdMs: number;
  readonly target?: EventTarget;
  readonly activityEvents?: ReadonlyArray<ActivityEventName>;
}

export interface IdleTracker {
  readonly subscribe: (listener: IdleChangeListener) => () => void;
  readonly dispose: () => void;
}
