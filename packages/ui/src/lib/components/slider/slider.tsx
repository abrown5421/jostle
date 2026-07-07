import React from 'react';
import { SliderProps, SliderSize } from './slider.types';

type ColorKey = NonNullable<SliderProps['color']>;

function inferDecimalPlaces(step: number): number {
  const str = step.toString();
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function snapToStep(value: number, min: number, step: number, decimalPlaces: number): number {
  const snapped = Math.round((value - min) / step) * step + min;
  return parseFloat(snapped.toFixed(decimalPlaces));
}

function toPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

interface SizeTokens {
  trackThickness: string; 
  thumbSize: string;
  thumbRing: string; 
  labelText: string; 
  tooltipText: string;
  tooltipPad: string;
  containerLength: string;
}

const sizeTokens: Record<SliderSize, SizeTokens> = {
  sm: {
    trackThickness: 'h-1',
    thumbSize: 'h-3.5 w-3.5',
    thumbRing: 'focus-visible:ring-2',
    labelText: 'text-xs',
    tooltipText: 'text-xs',
    tooltipPad: 'px-1.5 py-0.5',
    containerLength: 'w-48',
  },
  md: {
    trackThickness: 'h-1.5',
    thumbSize: 'h-4.5 w-4.5',
    thumbRing: 'focus-visible:ring-2',
    labelText: 'text-sm',
    tooltipText: 'text-xs',
    tooltipPad: 'px-2 py-1',
    containerLength: 'w-64',
  },
  lg: {
    trackThickness: 'h-2',
    thumbSize: 'h-5.5 w-5.5',
    thumbRing: 'focus-visible:ring-3',
    labelText: 'text-base',
    tooltipText: 'text-sm',
    tooltipPad: 'px-2.5 py-1',
    containerLength: 'w-80',
  },
};

const trackFillColor: Record<ColorKey, string> = {
  primary:             'var(--color-primary)',
  'primary-contrast':  'var(--color-primary-contrast)',
  secondary:           'var(--color-secondary)',
  'secondary-contrast':'var(--color-secondary-contrast)',
  accent:              'var(--color-accent)',
  'accent-contrast':   'var(--color-accent-contrast)',
  success:             'var(--color-success)',
  'success-contrast':  'var(--color-success-contrast)',
  warning:             'var(--color-warning)',
  'warning-contrast':  'var(--color-warning-contrast)',
  danger:              'var(--color-danger)',
  'danger-contrast':   'var(--color-danger-contrast)',
  surface:             'var(--color-surface)',
  'surface-contrast':  'var(--color-surface-contrast)',
  surface2:            'var(--color-surface2)',
  'surface2-contrast': 'var(--color-surface2-contrast)',
  surface3:            'var(--color-surface3)',
  'surface3-contrast': 'var(--color-surface3-contrast)',
  surface4:            'var(--color-surface4)',
  'surface4-contrast': 'var(--color-surface4-contrast)',
};

const thumbRingColor: Record<ColorKey, string> = {
  primary:             'focus-visible:ring-primary',
  'primary-contrast':  'focus-visible:ring-primary-contrast',
  secondary:           'focus-visible:ring-secondary',
  'secondary-contrast':'focus-visible:ring-secondary-contrast',
  accent:              'focus-visible:ring-accent',
  'accent-contrast':   'focus-visible:ring-accent-contrast',
  success:             'focus-visible:ring-success',
  'success-contrast':  'focus-visible:ring-success-contrast',
  warning:             'focus-visible:ring-warning',
  'warning-contrast':  'focus-visible:ring-warning-contrast',
  danger:              'focus-visible:ring-danger',
  'danger-contrast':   'focus-visible:ring-danger-contrast',
  surface:             'focus-visible:ring-surface',
  'surface-contrast':  'focus-visible:ring-surface-contrast',
  surface2:            'focus-visible:ring-surface2',
  'surface2-contrast': 'focus-visible:ring-surface2-contrast',
  surface3:            'focus-visible:ring-surface3',
  'surface3-contrast': 'focus-visible:ring-surface3-contrast',
  surface4:            'focus-visible:ring-surface4',
  'surface4-contrast': 'focus-visible:ring-surface4-contrast',
};

const tooltipBg: Record<ColorKey, string> = {
  primary:             'bg-primary text-primary-contrast',
  'primary-contrast':  'bg-primary-contrast text-primary',
  secondary:           'bg-secondary text-secondary-contrast',
  'secondary-contrast':'bg-secondary-contrast text-secondary',
  accent:              'bg-accent text-accent-contrast',
  'accent-contrast':   'bg-accent-contrast text-accent',
  success:             'bg-success text-success-contrast',
  'success-contrast':  'bg-success-contrast text-success',
  warning:             'bg-warning text-warning-contrast',
  'warning-contrast':  'bg-warning-contrast text-warning',
  danger:              'bg-danger text-danger-contrast',
  'danger-contrast':   'bg-danger-contrast text-danger',
  surface:             'bg-surface text-surface-contrast',
  'surface-contrast':  'bg-surface-contrast text-surface',
  surface2:            'bg-surface2 text-surface2-contrast',
  'surface2-contrast': 'bg-surface2-contrast text-surface2',
  surface3:            'bg-surface3 text-surface3-contrast',
  'surface3-contrast': 'bg-surface3-contrast text-surface3',
  surface4:            'bg-surface4 text-surface4-contrast',
  'surface4-contrast': 'bg-surface4-contrast text-surface4',
};

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  decimalPlaces,
  onChange,
  onChangeEnd,
  color = 'primary',
  size = 'md',
  orientation = 'horizontal',
  showTooltip = false,
  showTicks = false,
  showLabels = false,
  formatValue,
  disabled = false,
  fullWidth = false,
  overrideClassName,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props
}) => {
  const dp = decimalPlaces ?? inferDecimalPlaces(step);

  const defaultFormat = (v: number) => v.toFixed(dp);
  const fmt = formatValue ?? defaultFormat;

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState<number>(() => {
    const init = value ?? defaultValue ?? min;
    return snapToStep(clamp(init, min, max), min, step, dp);
  });

  React.useEffect(() => {
    if (isControlled && value !== undefined) {
      setInternalValue(snapToStep(clamp(value, min, max), min, step, dp));
    }
  }, [value, min, max, step, dp, isControlled]);

  const [showTooltipState, setShowTooltipState] = React.useState(false);

  const current = isControlled
    ? snapToStep(clamp(value!, min, max), min, step, dp)
    : internalValue;

  const percent = toPercent(current, min, max);

  const tokens = sizeTokens[size];
  const fillColor = trackFillColor[color];
  const isVertical = orientation === 'vertical';

  const ticks = React.useMemo<number[]>(() => {
    if (!showTicks) return [];
    const result: number[] = [];
    let v = min;
    while (v <= max + Number.EPSILON) {
      result.push(parseFloat(v.toFixed(dp)));
      v += step;
    }
    return result;
  }, [showTicks, min, max, step, dp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    const snapped = snapToStep(clamp(raw, min, max), min, step, dp);
    if (!isControlled) setInternalValue(snapped);
    onChange?.(snapped);
  };

  const handleMouseDown = () => setShowTooltipState(true);
  const handleMouseUp = () => {
    setShowTooltipState(false);
    onChangeEnd?.(current);
  };
  const handleTouchStart = () => setShowTooltipState(true);
  const handleTouchEnd = () => {
    setShowTooltipState(false);
    onChangeEnd?.(current);
  };

  const uid = React.useId().replace(/:/g, '');
  const inputId = `slider-input-${uid}`;
  const containerId = `slider-${uid}`;

  const trackBackground = isVertical
    ? `linear-gradient(to top, ${fillColor} ${percent}%, var(--slider-track-empty) ${percent}%)`
    : `linear-gradient(to right, ${fillColor} ${percent}%, var(--slider-track-empty) ${percent}%)`;

  const isTooltipVisible = showTooltip && showTooltipState;

  const rootClasses = overrideClassName
    ? overrideClassName
    : [
        'relative flex items-center',
        isVertical ? 'flex-col' : 'flex-row',
        isVertical
          ? (fullWidth ? 'h-full' : 'h-48')
          : (fullWidth ? 'w-full' : tokens.containerLength),
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        typeof className === 'string' ? className : '',
      ]
        .filter(Boolean)
        .join(' ');

  const renderLabel = (labelValue: number, position: 'start' | 'end') => (
    <span
      className={[
        tokens.labelText,
        'text-slate-500 select-none shrink-0',
        isVertical
          ? (position === 'start' ? 'mb-2' : 'mt-2')
          : (position === 'start' ? 'mr-2' : 'ml-2'),
      ].join(' ')}
    >
      {fmt(labelValue)}
    </span>
  );

  const renderTicks = () => {
    if (!showTicks || ticks.length === 0) return null;

    return (
      <div
        aria-hidden="true"
        className={[
          'absolute pointer-events-none',
          isVertical
            ? 'flex flex-col-reverse justify-between h-full top-0'
            : 'flex flex-row justify-between w-full left-0',
        ].join(' ')}
        style={isVertical ? { left: '50%', transform: 'translateX(-50%)' } : { top: '50%', transform: 'translateY(-50%)' }}
      >
        {ticks.map((tick) => {
          const isActive = tick <= current;
          return (
            <span
              key={tick}
              className="block rounded-full w-1 h-1 shrink-0 transition-colors duration-150"
              style={{ backgroundColor: isActive ? fillColor : 'var(--slider-track-empty)' }}
            />
          );
        })}
      </div>
    );
  };

  const renderTooltip = () => {
    if (!showTooltip) return null;

    return (
      <div
        aria-hidden="true"
        className={[
          'absolute pointer-events-none select-none transition-all duration-150 z-20',
          isTooltipVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          isVertical ? 'right-full mr-3' : 'bottom-full mb-3',
          'rounded-md shadow-md whitespace-nowrap',
          tokens.tooltipText,
          tokens.tooltipPad,
          tooltipBg[color],
        ].join(' ')}
        style={
          isVertical
            ? { top: `${100 - percent}%`, transform: 'translateY(-50%)' }
            : { left: `${percent}%`, transform: 'translateX(-50%)' }
        }
      >
        {fmt(current)}
        <span
          className={[
            'absolute w-0 h-0',
            isVertical
              ? 'top-1/2 -right-1.5 -translate-y-1/2 border-y-4 border-y-transparent border-l-4'
              : 'top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4',
          ].join(' ')}
          style={
            isVertical
              ? { borderLeftColor: fillColor }
              : { borderTopColor: fillColor }
          }
        />
      </div>
    );
  };

  const scopedStyles = `
    #${containerId} {
      --slider-track-empty: #e2e8f0;
    }

    #${inputId} {
      -webkit-appearance: none;
      appearance: none;
      background: ${trackBackground};
      border-radius: 9999px;
      outline: none;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
    }

    #${inputId}::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      background-color: ${fillColor};
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      border-radius: 9999px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    #${inputId}::-moz-range-thumb {
      background-color: ${fillColor};
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      border-radius: 9999px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    #${inputId}:not(:disabled)::-webkit-slider-thumb:hover,
    #${inputId}:focus-visible::-webkit-slider-thumb {
      transform: scale(1.18);
      box-shadow: 0 2px 8px rgba(0,0,0,0.22);
    }

    #${inputId}:not(:disabled)::-moz-range-thumb:hover,
    #${inputId}:focus-visible::-moz-range-thumb {
      transform: scale(1.18);
      box-shadow: 0 2px 8px rgba(0,0,0,0.22);
    }

    /* Vertical (writing-mode trick, supported in all modern browsers) */
    #${inputId}[orient="vertical"] {
      writing-mode: vertical-lr;
      direction: rtl;
    }
  `;

  const thumbPxMap: Record<SliderSize, number> = { sm: 14, md: 18, lg: 22 };
  const thumbPx = thumbPxMap[size];

  const trackThickPxMap: Record<SliderSize, number> = { sm: 4, md: 6, lg: 8 };
  const trackThickPx = trackThickPxMap[size];

  const thumbStyles = `
    #${inputId}::-webkit-slider-thumb {
      width: ${thumbPx}px;
      height: ${thumbPx}px;
    }
    #${inputId}::-moz-range-thumb {
      width: ${thumbPx}px;
      height: ${thumbPx}px;
    }
    #${inputId}::-webkit-slider-runnable-track {
      border-radius: 9999px;
    }
    #${inputId}::-moz-range-track {
      border-radius: 9999px;
      background: transparent;
    }
  `;

  return (
    <>
      <style>{scopedStyles + thumbStyles}</style>

      <div
        id={containerId}
        className={rootClasses}
        style={style}
        {...props}
      >
        {showLabels && renderLabel(min, 'start')}

        <div className={['relative flex items-center', isVertical ? 'flex-col h-full w-fit' : 'flex-row w-full'].join(' ')}>

          {renderTicks()}
          {renderTooltip()}

          <input
            id={inputId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={current}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-valuetext={fmt(current)}
            aria-orientation={orientation}
            {...(isVertical ? ({ orient: 'vertical' } as React.HTMLAttributes<HTMLInputElement>) : {})}
            className={[
              'focus:outline-none',
              tokens.thumbRing,
              thumbRingColor[color],
              'focus-visible:ring-offset-2',
              'transition-all duration-200',
              isVertical
                ? `w-[${trackThickPx}px] h-full`
                : `h-[${trackThickPx}px] w-full`,
            ].join(' ')}
            style={{
              ...(isVertical
                ? { width: `${trackThickPx}px`, height: '100%' }
                : { height: `${trackThickPx}px`, width: '100%' }),
              background: trackBackground,
            }}
            onChange={handleChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {showLabels && renderLabel(max, 'end')}
      </div>
    </>
  );
};