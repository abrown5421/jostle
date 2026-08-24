import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdleTracker } from './create-idle-tracker.js';

describe('createIdleTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions to idle after the threshold elapses with no activity', () => {
    const target = new EventTarget();
    const tracker = createIdleTracker({ thresholdMs: 1000, target });
    const listener = vi.fn();
    tracker.subscribe(listener);

    vi.advanceTimersByTime(999);
    expect(listener).not.toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledWith(true);

    tracker.dispose();
  });

  it('resets the timer on activity and reports not-idle', () => {
    const target = new EventTarget();
    const tracker = createIdleTracker({ thresholdMs: 1000, target });
    const listener = vi.fn();
    tracker.subscribe(listener);

    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenLastCalledWith(true);

    target.dispatchEvent(new Event('mousemove'));
    expect(listener).toHaveBeenLastCalledWith(false);

    vi.advanceTimersByTime(999);
    expect(listener).toHaveBeenLastCalledWith(false);

    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenLastCalledWith(true);

    tracker.dispose();
  });

  it('notifies a new subscriber with the current idle state immediately', () => {
    const target = new EventTarget();
    const tracker = createIdleTracker({ thresholdMs: 1000, target });

    vi.advanceTimersByTime(1000);

    const listener = vi.fn();
    tracker.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(true);

    tracker.dispose();
  });

  it('stops notifying after unsubscribe', () => {
    const target = new EventTarget();
    const tracker = createIdleTracker({ thresholdMs: 1000, target });
    const listener = vi.fn();
    const unsubscribe = tracker.subscribe(listener);
    unsubscribe();

    vi.advanceTimersByTime(1000);
    expect(listener).not.toHaveBeenCalledWith(true);

    tracker.dispose();
  });

  it('stops tracking activity after dispose', () => {
    const target = new EventTarget();
    const tracker = createIdleTracker({ thresholdMs: 1000, target });
    const listener = vi.fn();
    tracker.subscribe(listener);
    tracker.dispose();

    vi.advanceTimersByTime(1000);
    target.dispatchEvent(new Event('mousemove'));
    expect(listener).not.toHaveBeenCalledWith(true);
  });
});
