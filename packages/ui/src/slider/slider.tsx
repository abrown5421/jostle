import { useId } from 'react';
import type { ComponentPropsWithoutRef, CSSProperties, Ref } from 'react';
import { Container } from '../container/index.js';
import { cn } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, BrandColor } from '../shared/index.js';

// The filled/remaining split is painted via an inline gradient (computed
// per-render from value/min/max below), not classes, so it can't hit
// Tailwind's dynamic-class limitation. The thumb still needs static
// per-color classes though, via Tailwind's arbitrary-variant syntax to
// reach the vendor-prefixed pseudo-elements a plain utility can't target.
const TRACK_BASE_CLASS = cn(
  'h-2 w-full cursor-pointer appearance-none rounded-full transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary',
  '[&::-webkit-slider-runnable-track]:rounded-full',
  '[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent',
  '[&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer',
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
);

const THUMB_CLASS: Record<BrandColor, string> = {
  primary: '[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary focus:ring-primary',
  secondary: '[&::-webkit-slider-thumb]:bg-secondary [&::-moz-range-thumb]:bg-secondary focus:ring-secondary',
  accent: '[&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:bg-accent focus:ring-accent',
};

const TRACK_COLOR_VAR: Record<BrandColor, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
};
const TRACK_NEUTRAL_VAR = 'var(--color-surface-tertiary)';

const LABEL_CLASS = 'text-sm font-medium text-content-secondary';

export interface SliderProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'style' | 'color' | 'value' | 'onChange' | 'type'> {
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Color of the completed portion of the track. @default 'primary' */
  color?: BrandColor;
  label?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Slider({
  value,
  setValue,
  min = 0,
  max = 100,
  step = 1,
  color = 'primary',
  label,
  animation,
  className,
  style,
  ref,
  id,
  ...rest
}: SliderProps) {
  const generatedId = useId();
  const sliderId = id ?? generatedId;

  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const trackStyle: CSSProperties = {
    background: `linear-gradient(to right, ${TRACK_COLOR_VAR[color]} 0%, ${TRACK_COLOR_VAR[color]} ${percent}%, ${TRACK_NEUTRAL_VAR} ${percent}%, ${TRACK_NEUTRAL_VAR} 100%)`,
  };

  return (
    <Container direction="col" gap={1} animation={animation} className={className} style={style}>
      {label && (
        <label htmlFor={sliderId} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className={cn(TRACK_BASE_CLASS, THUMB_CLASS[color])}
        style={trackStyle}
        {...rest}
      />
    </Container>
  );
}
