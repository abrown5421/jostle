import React from 'react';
import { Input as HeadlessInput } from '@headlessui/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { InputProps, InputSize } from './input.types';

type ColorKey = NonNullable<InputProps['color']>;
type VariantKey = NonNullable<InputProps['variant']>;

const normalizeIconName = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_-]+/g, '-')
    .toLowerCase();

const sizeStyles: Record<InputSize, { container: string; input: string; label: string; iconSize: number; leadingIconSpacer: string; inlinePad: string; focusPad: string }> = {
  sm: {
    container: 'h-10',
    input: 'pt-4 pb-1 text-sm px-3',
    label: 'text-xs left-3 top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:top-2.5',
    leadingIconSpacer: 'pl-9',
    iconSize: 14,
    inlinePad: 'left-9',
    focusPad: 'peer-focus:left-9 peer-:not(:placeholder-shown):left-9 data-[floating=true]:left-9',
  },
  md: {
    container: 'h-12',
    input: 'pt-5 pb-1.5 text-base px-4',
    label: 'text-xs left-4 top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:top-3',
    leadingIconSpacer: 'pl-10',
    iconSize: 18,
    inlinePad: 'left-10',
    focusPad: 'peer-focus:left-10 peer-:not(:placeholder-shown):left-10 data-[floating=true]:left-10',
  },
  lg: {
    container: 'h-14',
    input: 'pt-6 pb-2 text-lg px-5',
    label: 'text-xs left-5 top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:top-3.5',
    leadingIconSpacer: 'pl-12',
    iconSize: 22,
    inlinePad: 'left-12',
    focusPad: 'peer-focus:left-12 peer-:not(:placeholder-shown):left-12 data-[floating=true]:left-12',
  },
};

const variantBaseStyles: Record<VariantKey, string> = {
  outline: 'bg-transparent border border-slate-300 focus:border-2 focus:pt-[19px] focus:pb-[5px]',
  filled: 'bg-slate-100 border-b-2 border-transparent focus:bg-slate-50',
  standard: 'bg-transparent border-b-2 border-slate-300 rounded-none! px-0!',
};

// Maps variants cleanly to theme dynamic border/rings while using semantic text color tokens
const focusColorStyles: Record<ColorKey, string> = {
  primary: 'focus:border-primary focus:ring-primary',
  secondary: 'focus:border-secondary focus:ring-secondary',
  accent: 'focus:border-accent focus:ring-accent',
  success: 'focus:border-success focus:ring-success',
  warning: 'focus:border-warning focus:ring-warning',
  danger: 'focus:border-danger focus:ring-danger',
  surface: 'focus:border-surface focus:ring-surface',
  surface2: 'focus:border-surface2 focus:ring-surface2',
  surface3: 'focus:border-surface3 focus:ring-surface3',
  surface4: 'focus:border-surface4 focus:ring-surface4',
  'primary-contrast': 'focus:border-primary-contrast focus:ring-primary-contrast',
  'secondary-contrast': 'focus:border-secondary-contrast focus:ring-secondary-contrast',
  'accent-contrast': 'focus:border-accent-contrast focus:ring-accent-contrast',
  'success-contrast': 'focus:border-success-contrast focus:ring-success-contrast',
  'warning-contrast': 'focus:border-warning-contrast focus:ring-warning-contrast',
  'danger-contrast': 'focus:border-danger-contrast focus:ring-danger-contrast',
  'surface-contrast': 'focus:border-surface-contrast focus:ring-surface-contrast',
  'surface2-contrast': 'focus:border-surface2-contrast focus:ring-surface2-contrast',
  'surface3-contrast': 'focus:border-surface3-contrast focus:ring-surface3-contrast',
  'surface4-contrast': 'focus:border-surface4-contrast focus:ring-surface4-contrast',
};

const textColorStyles: Record<ColorKey, string> = {
  primary: 'text-surface-contrast',
  secondary: 'text-surface-contrast',
  accent: 'text-surface-contrast',
  success: 'text-surface-contrast',
  warning: 'text-surface-contrast',
  danger: 'text-surface-contrast',
  surface: 'text-surface-contrast',
  surface2: 'text-surface2-contrast',
  surface3: 'text-surface3-contrast',
  surface4: 'text-surface4-contrast',
  'primary-contrast': 'text-primary-contrast',
  'secondary-contrast': 'text-secondary-contrast',
  'accent-contrast': 'text-accent-contrast',
  'success-contrast': 'text-success-contrast',
  'warning-contrast': 'text-warning-contrast',
  'danger-contrast': 'text-danger-contrast',
  'surface-contrast': 'text-surface-contrast',
  'surface2-contrast': 'text-surface2-contrast',
  'surface3-contrast': 'text-surface3-contrast',
  'surface4-contrast': 'text-surface4-contrast',
};

const labelColorStyles: Record<ColorKey, string> = {
  primary: 'peer-focus:text-primary peer-:not(:placeholder-shown):text-primary data-[floating=true]:text-primary',
  secondary: 'peer-focus:text-secondary peer-:not(:placeholder-shown):text-secondary data-[floating=true]:text-secondary',
  accent: 'peer-focus:text-accent peer-:not(:placeholder-shown):text-accent data-[floating=true]:text-accent',
  success: 'peer-focus:text-success peer-:not(:placeholder-shown):text-success data-[floating=true]:text-success',
  warning: 'peer-focus:text-warning peer-:not(:placeholder-shown):text-warning data-[floating=true]:text-warning',
  danger: 'peer-focus:text-danger peer-:not(:placeholder-shown):text-danger data-[floating=true]:text-danger',
  surface: 'peer-focus:text-surface peer-:not(:placeholder-shown):text-surface data-[floating=true]:text-surface',
  surface2: 'peer-focus:text-surface2 peer-:not(:placeholder-shown):text-surface2 data-[floating=true]:text-surface2',
  surface3: 'peer-focus:text-surface3 peer-:not(:placeholder-shown):text-surface3 data-[floating=true]:text-surface3',
  surface4: 'peer-focus:text-surface4 peer-:not(:placeholder-shown):text-surface4 data-[floating=true]:text-surface4',
  'primary-contrast': 'peer-focus:text-primary-contrast peer-:not(:placeholder-shown):text-primary-contrast data-[floating=true]:text-primary-contrast',
  'secondary-contrast': 'peer-focus:text-secondary-contrast peer-:not(:placeholder-shown):text-secondary-contrast data-[floating=true]:text-secondary-contrast',
  'accent-contrast': 'peer-focus:text-accent-contrast peer-:not(:placeholder-shown):text-accent-contrast data-[floating=true]:text-accent-contrast',
  'success-contrast': 'peer-focus:text-success-contrast peer-:not(:placeholder-shown):text-success-contrast data-[floating=true]:text-success-contrast',
  'warning-contrast': 'peer-focus:text-warning-contrast peer-:not(:placeholder-shown):text-warning-contrast data-[floating=true]:text-warning-contrast',
  'danger-contrast': 'focus:border-danger-contrast focus:ring-danger-contrast',
  'surface-contrast': 'peer-focus:text-surface-contrast peer-:not(:placeholder-shown):text-surface-contrast data-[floating=true]:text-surface-contrast',
  'surface2-contrast': 'peer-focus:text-surface2-contrast peer-:not(:placeholder-shown):text-surface2-contrast data-[floating=true]:text-surface2-contrast',
  'surface3-contrast': 'peer-focus:text-surface3-contrast peer-:not(:placeholder-shown):text-surface3-contrast data-[floating=true]:text-surface3-contrast',
  'surface4-contrast': 'peer-focus:text-surface4-contrast peer-:not(:placeholder-shown):text-surface4-contrast data-[floating=true]:text-surface4-contrast',
};

const INPUT_BASE =
  'peer block w-full appearance-none outline-hidden transition-all duration-200 ease-in-out ' +
  'placeholder-transparent! focus:outline-hidden ';

const CONTAINER_BASE = 'relative flex items-center transition-all duration-200 ';

const ANIMATION_STATE_CLASSES = 
  'peer-focus:top-0.5 peer-focus:scale-85 ' +
  'peer-:not(:placeholder-shown):top-0.5 peer-:not(:placeholder-shown):scale-85 ' +
  'data-[floating=true]:top-0.5 data-[floating=true]:scale-85';

interface SafeIconProps {
  name: string;
  size: number;
  className?: string;
}

const SafeIcon: React.FC<SafeIconProps> = ({ name, size, className }) => {
  try {
    const usableName = normalizeIconName(name) as any;
    return <DynamicIcon name={usableName} size={size} className={className} aria-hidden="true" />;
  } catch {
    return null;
  }
};

export const Input: React.FC<InputProps> = ({
  label,
  color = 'primary',
  variant = 'outline',
  size = 'md',
  rounded = true,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  overrideClassName,
  style,
  onChange,
  id,
  value,
  defaultValue,
  disabled,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const currentSize = sizeStyles[size];

  const [internalValue, setInternalValue] = React.useState(() => value ?? defaultValue ?? '');

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const isFloating = String(internalValue).length > 0;

  const disabledStyles = disabled 
    ? 'bg-slate-100! text-slate-400! border-slate-200! cursor-not-allowed select-none' 
    : '';

  const builtInputClasses = overrideClassName
    ? [INPUT_BASE, overrideClassName, disabledStyles].filter(Boolean).join(' ')
    : [
        INPUT_BASE,
        currentSize.input,
        variantBaseStyles[variant],
        focusColorStyles[color],
        textColorStyles[color],
        rounded && variant !== 'standard' ? 'rounded-md' : 'rounded-none',
        leadingIcon ? currentSize.leadingIconSpacer : '',
        trailingIcon ? 'pr-10' : '',
        disabledStyles,
        typeof className === 'string' ? className : '',
      ]
        .filter(Boolean)
        .join(' ');

  const labelPlacementClasses = variant === 'standard' 
    ? 'left-0 top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:top-3' 
    : currentSize.label;

  const shiftedLabelPadding = leadingIcon && variant !== 'standard'
    ? `${currentSize.inlinePad} ${currentSize.focusPad}`
    : '';

  return (
    <div
      className={[
        CONTAINER_BASE,
        currentSize.container,
        fullWidth ? 'w-full' : 'w-72',
        disabled ? 'cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {leadingIcon && (
        <span 
          className={`absolute flex items-center pointer-events-none transition-colors z-10 ${disabled ? 'text-slate-300' : 'text-slate-400 peer-focus:text-slate-600'}`}
          style={{ left: variant === 'standard' ? '0px' : '12px' }}
        >
          <SafeIcon name={leadingIcon} size={currentSize.iconSize} />
        </span>
      )}

      <HeadlessInput
        id={inputId}
        placeholder={label}
        value={value}
        defaultValue={defaultValue}
        className={builtInputClasses}
        onChange={handleInputChange}
        disabled={disabled}
        {...props}
      />

      <label
        htmlFor={inputId}
        data-floating={isFloating}
        className={[
          'absolute text-slate-400 pointer-events-none origin-top-left transition-all duration-200 ease-in-out z-10',
          ANIMATION_STATE_CLASSES,
          labelPlacementClasses,
          shiftedLabelPadding,
          disabled ? 'peer-focus:text-slate-400! data-[floating=true]:text-slate-400!' : labelColorStyles[color],
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </label>

      {trailingIcon && (
        <span className={`absolute right-3 flex items-center pointer-events-none transition-colors z-10 ${disabled ? 'text-slate-300' : 'text-slate-400 peer-focus:text-slate-600'}`}>
          <SafeIcon name={trailingIcon} size={currentSize.iconSize} />
        </span>
      )}
    </div>
  );
};