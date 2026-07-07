import React from 'react';
import { Switch as HeadlessSwitch, Field, Label } from '@headlessui/react';
import { SwitchProps, SwitchSize } from './switch.types';

type ColorKey = NonNullable<SwitchProps['color']>;

const sizeStyles: Record<SwitchSize, { track: string; handle: string; translate: string; text: string; gap: string }> = {
  sm: { track: 'w-8 h-4', handle: 'h-3 w-3', translate: 'group-data-checked:translate-x-4 translate-x-0.5', text: 'text-xs', gap: 'gap-x-2' },
  md: { track: 'w-11 h-6', handle: 'h-5 w-5', translate: 'group-data-checked:translate-x-5 translate-x-0.5', text: 'text-sm', gap: 'gap-x-2.5' },
  lg: { track: 'w-14 h-8', handle: 'h-7 w-7', translate: 'group-data-checked:translate-x-6 translate-x-0.5', text: 'text-base', gap: 'gap-x-3' },
};

const colorStyles: Record<ColorKey, string> = {
  primary: 'data-checked:bg-primary focus:outline-primary',
  secondary: 'data-checked:bg-secondary focus:outline-secondary',
  accent: 'data-checked:bg-accent focus:outline-accent',
  success: 'data-checked:bg-success focus:outline-success',
  warning: 'data-checked:bg-warning focus:outline-warning',
  danger: 'data-checked:bg-danger focus:outline-danger',
  surface: 'data-checked:bg-surface focus:outline-surface',
  surface2: 'data-checked:bg-surface2 focus:outline-surface2',
  surface3: 'data-checked:bg-surface3 focus:outline-surface3',
  surface4: 'data-checked:bg-surface4 focus:outline-surface4',
  'primary-contrast': 'data-checked:bg-primary-contrast focus:outline-primary-contrast',
  'secondary-contrast': 'data-checked:bg-secondary-contrast focus:outline-secondary-contrast',
  'accent-contrast': 'data-checked:bg-accent-contrast focus:outline-accent-contrast',
  'success-contrast': 'data-checked:bg-success-contrast focus:outline-success-contrast',
  'warning-contrast': 'data-checked:bg-warning-contrast focus:outline-warning-contrast',
  'danger-contrast': 'data-checked:bg-danger-contrast focus:outline-danger-contrast',
  'surface-contrast': 'data-checked:bg-surface-contrast focus:outline-surface-contrast',
  'surface2-contrast': 'data-checked:bg-surface2-contrast focus:outline-surface2-contrast',
  'surface3-contrast': 'data-checked:bg-surface3-contrast focus:outline-surface3-contrast',
  'surface4-contrast': 'data-checked:bg-surface4-contrast focus:outline-surface4-contrast',
};

export const Switch: React.FC<SwitchProps> = ({
  label,
  color = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  const currentSize = sizeStyles[size];

  return (
    <Field className={`flex items-center ${currentSize.gap} ${className ?? ''}`.trim()}>
      <HeadlessSwitch
        {...props}
        className={[
          'peer group inline-flex items-center rounded-full bg-slate-200 transition-colors duration-200 ease-in-out',
          'cursor-pointer focus:outline-2 focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          currentSize.track,
          colorStyles[color],
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out transform',
            currentSize.handle,
            currentSize.translate,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </HeadlessSwitch>
      {label && (
        <Label className={`select-none font-medium text-slate-700 cursor-pointer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed ${currentSize.text}`}>
          {label}
        </Label>
      )}
    </Field>
  );
};