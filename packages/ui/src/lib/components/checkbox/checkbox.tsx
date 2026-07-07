import React from 'react';
import { Checkbox as HeadlessCheckbox, Field, Label } from '@headlessui/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { CheckboxProps, CheckboxSize } from './checkbox.types';

type ColorKey = NonNullable<CheckboxProps['color']>;

const sizeStyles: Record<CheckboxSize, { box: string; icon: number; text: string; gap: string }> = {
  sm: { box: 'h-4 w-4 rounded-xs', icon: 10, text: 'text-xs', gap: 'gap-x-2' },
  md: { box: 'h-5 w-5 rounded-sm', icon: 12, text: 'text-sm', gap: 'gap-x-2.5' },
  lg: { box: 'h-6 w-6 rounded-md', icon: 16, text: 'text-base', gap: 'gap-x-3' },
};

const colorStyles: Record<ColorKey, string> = {
  primary: 'data-checked:bg-primary data-checked:border-primary focus:outline-primary',
  secondary: 'data-checked:bg-secondary data-checked:border-secondary focus:outline-secondary',
  accent: 'data-checked:bg-accent data-checked:border-accent focus:outline-accent',
  success: 'data-checked:bg-success data-checked:border-success focus:outline-success',
  warning: 'data-checked:bg-warning data-checked:border-warning focus:outline-warning',
  danger: 'data-checked:bg-danger data-checked:border-danger focus:outline-danger',
  surface: 'data-checked:bg-surface data-checked:border-surface focus:outline-surface',
  surface2: 'data-checked:bg-surface2 data-checked:border-surface2 focus:outline-surface2',
  surface3: 'data-checked:bg-surface3 data-checked:border-surface3 focus:outline-surface3',
  surface4: 'data-checked:bg-surface4 data-checked:border-surface4 focus:outline-surface4',
  'primary-contrast': 'data-checked:bg-primary-contrast data-checked:border-primary-contrast focus:outline-primary-contrast',
  'secondary-contrast': 'data-checked:bg-secondary-contrast data-checked:border-secondary-contrast focus:outline-secondary-contrast',
  'accent-contrast': 'data-checked:bg-accent-contrast data-checked:border-accent-contrast focus:outline-accent-contrast',
  'success-contrast': 'data-checked:bg-success-contrast data-checked:border-success-contrast focus:outline-success-contrast',
  'warning-contrast': 'data-checked:bg-warning-contrast data-checked:border-warning-contrast focus:outline-warning-contrast',
  'danger-contrast': 'data-checked:bg-danger-contrast data-checked:border-danger-contrast focus:outline-danger-contrast',
  'surface-contrast': 'data-checked:bg-surface-contrast data-checked:border-surface-contrast focus:outline-surface-contrast',
  'surface2-contrast': 'data-checked:bg-surface2-contrast data-checked:border-surface2-contrast focus:outline-surface2-contrast',
  'surface3-contrast': 'data-checked:bg-surface3-contrast data-checked:border-surface3-contrast focus:outline-surface3-contrast',
  'surface4-contrast': 'data-checked:bg-surface4-contrast data-checked:border-surface4-contrast focus:outline-surface4-contrast',
};

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  color = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  const currentSize = sizeStyles[size];

  return (
    <Field className={`flex items-center ${currentSize.gap} ${className ?? ''}`.trim()}>
      <HeadlessCheckbox
        {...props}
        className={[
          'peer group flex items-center justify-center border border-slate-300 bg-white transition-all duration-150',
          'cursor-pointer select-none focus:outline-2 focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          currentSize.box,
          colorStyles[color],
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="hidden group-data-checked:flex text-white">
          <DynamicIcon name="check" size={currentSize.icon} strokeWidth={3} />
        </span>
      </HeadlessCheckbox>
      {label && (
        <Label className={`select-none font-medium text-slate-700 cursor-pointer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed ${currentSize.text}`}>
          {label}
        </Label>
      )}
    </Field>
  );
};