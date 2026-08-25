import { Text } from '@jostle/ui';
import { useEffect, useRef, useState } from 'react';

const STROKE_WIDTH = 10;
const TICK_INTERVAL_MS = 200;

export interface CircularCountdownTimerProps {
  readonly phaseEndsAt: string | null;
  readonly size?: number;
  readonly label?: string;
  readonly className?: string;
}

export function CircularCountdownTimer({
  phaseEndsAt,
  size = 220,
  label,
  className,
}: CircularCountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const totalDurationMsRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const endsAtMs = phaseEndsAt ? new Date(phaseEndsAt).getTime() : now;
  const remainingMs = Math.max(0, endsAtMs - now);

  if (totalDurationMsRef.current === null) {
    totalDurationMsRef.current = remainingMs;
  }
  const totalDurationMs = totalDurationMsRef.current || remainingMs || 1;

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const fraction = Math.max(0, Math.min(1, remainingMs / totalDurationMs));

  const radius = size / 2 - STROKE_WIDTH;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={STROKE_WIDTH}
          className="stroke-surface-tertiary"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-200 ease-linear"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <Text fontSize="4xl" fontWeight="bold" textColor="content-primary">
          {remainingSeconds}
        </Text>
        {label && (
          <Text fontSize="sm" textColor="content-secondary">
            {label}
          </Text>
        )}
      </div>
    </div>
  );
}
