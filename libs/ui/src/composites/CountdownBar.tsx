import { useEffect, useState } from 'react';
import { Box, Text } from '../components';
import { mergeClassNames } from '../theme/mergeClassNames';
import { resolveColorClass } from '../theme/resolveColorClass';
import type { ColorSpec } from '../contracts/color.contract';

export interface CountdownBarProps {
  // When the countdown hits zero, in the same epoch-ms clock as `now`. Null = not running
  // (paused, or waiting to start) - the bar then holds at `pausedRemainingMs`.
  readonly endsAt: number | null;
  readonly totalMs: number;
  // What was left when it paused. Null with no `endsAt` shows a full bar.
  readonly pausedRemainingMs?: number | null;
  // The clock `endsAt` is measured in - pass a server-corrected one when the deadline is the
  // server's. Defaults to this device's clock.
  readonly now?: () => number;
  readonly showSeconds?: boolean;
  readonly color?: ColorSpec;
  readonly trackColor?: ColorSpec;
  readonly className?: string;
}

const DEFAULT_COLOR: ColorSpec = { color: 'primary', intensity: 500 };
const DEFAULT_TRACK_COLOR: ColorSpec = { color: 'surface', intensity: 300 };

const remainingOf = (endsAt: number | null, pausedRemainingMs: number | null | undefined, totalMs: number, now: () => number) =>
  endsAt === null ? (pausedRemainingMs ?? totalMs) : Math.max(0, endsAt - now());

// A draining bar (plus seconds left) for a deadline that lives elsewhere - it never owns time, it
// only renders how far `now` is from `endsAt`, so pausing or moving the deadline is just new props.
export const CountdownBar = ({
  endsAt,
  totalMs,
  pausedRemainingMs,
  now = Date.now,
  showSeconds = true,
  color = DEFAULT_COLOR,
  trackColor = DEFAULT_TRACK_COLOR,
  className,
}: CountdownBarProps) => {
  const [remainingMs, setRemainingMs] = useState(() => remainingOf(endsAt, pausedRemainingMs, totalMs, now));

  useEffect(() => {
    setRemainingMs(remainingOf(endsAt, pausedRemainingMs, totalMs, now));
    if (endsAt === null) return undefined;
    let frame = 0;
    const tick = () => {
      const next = remainingOf(endsAt, pausedRemainingMs, totalMs, now);
      setRemainingMs(next);
      if (next > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [endsAt, pausedRemainingMs, totalMs, now]);

  const fraction = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <Box flex={{ direction: 'row', align: 'center', gap: 12 }} className={mergeClassNames('w-full', className)}>
      <div
        role="progressbar"
        aria-label="Time left"
        aria-valuemin={0}
        aria-valuemax={Math.ceil(totalMs / 1000)}
        aria-valuenow={seconds}
        className={mergeClassNames('h-3 flex-1 overflow-hidden rounded-full', resolveColorClass('bg', trackColor))}
      >
        <div className={mergeClassNames('h-full rounded-full', resolveColorClass('bg', color))} style={{ width: `${fraction * 100}%` }} />
      </div>
      {showSeconds && (
        <Text as="span" className="w-10 text-right font-mono text-lg font-bold tabular-nums">
          {seconds}s
        </Text>
      )}
    </Box>
  );
};
