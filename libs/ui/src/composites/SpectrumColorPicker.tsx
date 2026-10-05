import { useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Box } from '../components';
import { mergeClassNames } from '../theme/mergeClassNames';

export interface SpectrumColorPickerProps {
  // '#rrggbb'.
  readonly value: string;
  // Every movement while dragging.
  readonly onChange: (hex: string) => void;
  // When a drag (or a keyboard nudge) finishes - for work too heavy to do on every movement.
  readonly onChangeEnd?: (hex: string) => void;
  readonly disabled?: boolean;
  // Accessible name for the whole picker.
  readonly label?: string;
  readonly className?: string;
}

// A free-form color picker - a saturation/brightness square plus a hue bar - sized for thumbs.
// Unlike ColorPicker (theme tokens and Tailwind swatches, for styling the app), this reaches any
// color, which is what a game like Point of Hue needs. Built on react-colorful (tiny, touch- and
// keyboard-friendly); deliberately no hex text field.
export const SpectrumColorPicker = ({ value, onChange, onChangeEnd, disabled = false, label = 'Color picker', className }: SpectrumColorPickerProps) => {
  // The latest color, read when a drag ends - the `value` prop may still be a render behind then.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const change = (hex: string) => {
    latest.current = hex;
    onChange(hex);
  };
  const finish = () => onChangeEnd?.(latest.current);

  return (
    <Box flex={{ direction: 'col', gap: 12 }} className={mergeClassNames('w-full', className)}>
      <div
        role="group"
        aria-label={label}
        aria-disabled={disabled}
        onPointerUp={finish}
        onKeyUp={finish}
        className={mergeClassNames(
          'w-full touch-none select-none',
          '[&_.react-colorful]:!h-72 [&_.react-colorful]:!w-full',
          '[&_.react-colorful__saturation]:rounded-t-xl [&_.react-colorful__last-control]:rounded-b-xl',
          '[&_.react-colorful__hue]:!h-12',
          '[&_.react-colorful__pointer]:!h-9 [&_.react-colorful__pointer]:!w-9',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <HexColorPicker color={value} onChange={change} />
      </div>
      <div aria-hidden className="h-16 w-full rounded-xl border border-surface-300 shadow-inner" style={{ backgroundColor: value }} />
    </Box>
  );
};
