import React from 'react';
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ComboboxProps, ComboboxSize } from './combobox.types';

type ColorKey = NonNullable<ComboboxProps['color']>;
type VariantKey = NonNullable<ComboboxProps['variant']>;

const normalizeIconName = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_-]+/g, '-')
    .toLowerCase();

const sizeStyles: Record<
  ComboboxSize,
  {
    container: string;
    input: string;
    label: string;
    iconSize: number;
    leadingIconSpacer: string;
    inlinePad: string;
    focusPad: string;
    optionPy: string;
    optionPx: string;
    optionText: string;
    checkSize: number;
  }
> = {
  sm: {
    container: 'h-10',
    input: 'pt-4 pb-1 text-sm px-3',
    label: 'text-xs left-3 top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:top-2.5',
    leadingIconSpacer: 'pl-9',
    iconSize: 14,
    inlinePad: 'left-9',
    focusPad: 'peer-focus:left-9 peer-:not(:placeholder-shown):left-9 data-[floating=true]:left-9',
    optionPy: 'py-1.5',
    optionPx: 'px-3',
    optionText: 'text-sm',
    checkSize: 13,
  },
  md: {
    container: 'h-12',
    input: 'pt-5 pb-1.5 text-base px-4',
    label: 'text-xs left-4 top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:top-3',
    leadingIconSpacer: 'pl-10',
    iconSize: 18,
    inlinePad: 'left-10',
    focusPad:
      'peer-focus:left-10 peer-:not(:placeholder-shown):left-10 data-[floating=true]:left-10',
    optionPy: 'py-2',
    optionPx: 'px-4',
    optionText: 'text-base',
    checkSize: 16,
  },
  lg: {
    container: 'h-14',
    input: 'pt-6 pb-2 text-lg px-5',
    label: 'text-xs left-5 top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:top-3.5',
    leadingIconSpacer: 'pl-12',
    iconSize: 22,
    inlinePad: 'left-12',
    focusPad:
      'peer-focus:left-12 peer-:not(:placeholder-shown):left-12 data-[floating=true]:left-12',
    optionPy: 'py-2.5',
    optionPx: 'px-5',
    optionText: 'text-lg',
    checkSize: 20,
  },
};

const variantBaseStyles: Record<VariantKey, string> = {
  outline: 'bg-transparent border border-slate-300 focus:border-2 focus:pt-[19px] focus:pb-[5px]',
  filled: 'bg-slate-100 border-b-2 border-transparent focus:bg-slate-50',
  standard: 'bg-transparent border-b-2 border-slate-300 rounded-none! px-0!',
};

const focusColorStyles: Record<ColorKey, string> = {
  primary: 'focus:border-primary focus:ring-primary text-slate-900',
  secondary: 'focus:border-secondary focus:ring-secondary text-slate-900',
  accent: 'focus:border-accent focus:ring-accent text-slate-900',
  success: 'focus:border-success focus:ring-success text-slate-900',
  warning: 'focus:border-warning focus:ring-warning text-slate-900',
  danger: 'focus:border-danger focus:ring-danger text-slate-900',
  surface: 'focus:border-surface focus:ring-surface text-slate-900',
  surface2: 'focus:border-surface2 focus:ring-surface2 text-slate-900',
  surface3: 'focus:border-surface3 focus:ring-surface3 text-slate-900',
  surface4: 'focus:border-surface4 focus:ring-surface4 text-slate-900',
  'primary-contrast': 'focus:border-primary-contrast focus:ring-primary-contrast text-slate-900',
  'secondary-contrast':
    'focus:border-secondary-contrast focus:ring-secondary-contrast text-slate-900',
  'accent-contrast': 'focus:border-accent-contrast focus:ring-accent-contrast text-slate-900',
  'success-contrast': 'focus:border-success-contrast focus:ring-success-contrast text-slate-900',
  'warning-contrast': 'focus:border-warning-contrast focus:ring-warning-contrast text-slate-900',
  'danger-contrast': 'focus:border-danger-contrast focus:ring-danger-contrast text-slate-900',
  'surface-contrast': 'focus:border-surface-contrast focus:ring-surface-contrast text-slate-900',
  'surface2-contrast':
    'focus:border-surface2-contrast focus:ring-surface2-contrast text-slate-900',
  'surface3-contrast':
    'focus:border-surface3-contrast focus:ring-surface3-contrast text-slate-900',
  'surface4-contrast':
    'focus:border-surface4-contrast focus:ring-surface4-contrast text-slate-900',
};

const labelColorStyles: Record<ColorKey, string> = {
  primary:
    'peer-focus:text-primary peer-:not(:placeholder-shown):text-primary data-[floating=true]:text-primary',
  secondary:
    'peer-focus:text-secondary peer-:not(:placeholder-shown):text-secondary data-[floating=true]:text-secondary',
  accent:
    'peer-focus:text-accent peer-:not(:placeholder-shown):text-accent data-[floating=true]:text-accent',
  success:
    'peer-focus:text-success peer-:not(:placeholder-shown):text-success data-[floating=true]:text-success',
  warning:
    'peer-focus:text-warning peer-:not(:placeholder-shown):text-warning data-[floating=true]:text-warning',
  danger:
    'peer-focus:text-danger peer-:not(:placeholder-shown):text-danger data-[floating=true]:text-danger',
  surface:
    'peer-focus:text-surface peer-:not(:placeholder-shown):text-surface data-[floating=true]:text-surface',
  surface2:
    'peer-focus:text-surface2 peer-:not(:placeholder-shown):text-surface2 data-[floating=true]:text-surface2',
  surface3:
    'peer-focus:text-surface3 peer-:not(:placeholder-shown):text-surface3 data-[floating=true]:text-surface3',
  surface4:
    'peer-focus:text-surface4 peer-:not(:placeholder-shown):text-surface4 data-[floating=true]:text-surface4',
  'primary-contrast':
    'peer-focus:text-primary-contrast peer-:not(:placeholder-shown):text-primary-contrast data-[floating=true]:text-primary-contrast',
  'secondary-contrast':
    'peer-focus:text-secondary-contrast peer-:not(:placeholder-shown):text-secondary-contrast data-[floating=true]:text-secondary-contrast',
  'accent-contrast':
    'peer-focus:text-accent-contrast peer-:not(:placeholder-shown):text-accent-contrast data-[floating=true]:text-accent-contrast',
  'success-contrast':
    'peer-focus:text-success-contrast peer-:not(:placeholder-shown):text-success-contrast data-[floating=true]:text-success-contrast',
  'warning-contrast':
    'peer-focus:text-warning-contrast peer-:not(:placeholder-shown):text-warning-contrast data-[floating=true]:text-warning-contrast',
  'danger-contrast':
    'peer-focus:text-danger-contrast peer-:not(:placeholder-shown):text-danger-contrast data-[floating=true]:text-danger-contrast',
  'surface-contrast':
    'peer-focus:text-surface-contrast peer-:not(:placeholder-shown):text-surface-contrast data-[floating=true]:text-surface-contrast',
  'surface2-contrast':
    'peer-focus:text-surface2-contrast peer-:not(:placeholder-shown):text-surface2-contrast data-[floating=true]:text-surface2-contrast',
  'surface3-contrast':
    'peer-focus:text-surface3-contrast peer-:not(:placeholder-shown):text-surface3-contrast data-[floating=true]:text-surface3-contrast',
  'surface4-contrast':
    'peer-focus:text-surface4-contrast peer-:not(:placeholder-shown):text-surface4-contrast data-[floating=true]:text-surface4-contrast',
};

const INPUT_BASE =
  'peer block w-full appearance-none outline-hidden transition-all duration-200 ease-in-out ' +
  'placeholder-transparent! text-slate-900 focus:outline-hidden pr-10 ';

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

export function Combobox<T = string>({
  label,
  options,
  color = 'primary',
  variant = 'outline',
  size = 'md',
  rounded = true,
  fullWidth = false,
  leadingIcon,
  className,
  overrideClassName,
  style,
  onQueryChange,
  onChange,
  onClose,
  immediate,
  allowCustomValue = false,
  renderCreateOption,
  disabled,
  invalid,
  value,
  defaultValue,
  by,
  name,
}: ComboboxProps<T>) {
  const generatedId = React.useId();
  const inputId = `${generatedId}-input`;
  const currentSize = sizeStyles[size];

  const [query, setQuery] = React.useState('');

  const [isFloating, setIsFloating] = React.useState(() => {
    const initial = value ?? defaultValue;
    return initial != null && String(initial) !== '';
  });

  React.useEffect(() => {
    if (value !== undefined) {
      setIsFloating(value != null && String(value) !== '');
    }
  }, [value]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onQueryChange?.(q);
  };

  const handleChange = (val: T | null) => {
    setIsFloating(val != null && String(val) !== '');
    onChange?.(val);
  };

  const handleClose = () => {
    setQuery('');
    onClose?.();
  };

  const filteredOptions =
    query === ''
      ? options
      : options.filter((opt) =>
          String(opt.label).toLowerCase().includes(query.toLowerCase()),
        );

  const showCreateOption =
    allowCustomValue &&
    query.length > 0 &&
    !options.some((opt) => String(opt.label).toLowerCase() === query.toLowerCase());

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
        rounded && variant !== 'standard' ? 'rounded-md' : 'rounded-none',
        leadingIcon ? currentSize.leadingIconSpacer : '',
        disabledStyles,
        typeof className === 'string' ? className : '',
      ]
        .filter(Boolean)
        .join(' ');

  const labelPlacementClasses =
    variant === 'standard'
      ? 'left-0 top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:top-3'
      : currentSize.label;

  const shiftedLabelPadding =
    leadingIcon && variant !== 'standard'
      ? `${currentSize.inlinePad} ${currentSize.focusPad}`
      : '';

  const optionClasses = [
    'flex items-center gap-2 w-full cursor-default select-none',
    currentSize.optionPy,
    currentSize.optionPx,
    currentSize.optionText,
    'text-slate-900',
    'data-focus:bg-slate-100',
    'data-disabled:opacity-40 data-disabled:cursor-not-allowed',
  ].join(' ');

  return (
    <HeadlessCombobox
      value={value as T}
      defaultValue={defaultValue}
      onChange={handleChange}
      onClose={handleClose}
      disabled={disabled}
      invalid={invalid}
      immediate={immediate}
      by={by as any}
      name={name}
    >
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
            className={`absolute flex items-center pointer-events-none transition-colors z-10 ${
              disabled ? 'text-slate-300' : 'text-slate-400'
            }`}
            style={{ left: variant === 'standard' ? '0px' : '12px' }}
          >
            <SafeIcon name={leadingIcon} size={currentSize.iconSize} />
          </span>
        )}

        <ComboboxInput
          id={inputId}
          placeholder={label}
          displayValue={(item: T) => {
            if (item == null) return '';
            const match = options.find((o) => o.value === item);
            return match ? match.label : String(item);
          }}
          onChange={handleQueryChange}
          className={builtInputClasses}
          disabled={disabled}
        />

        <label
          htmlFor={inputId}
          data-floating={isFloating}
          className={[
            'absolute text-slate-400 pointer-events-none origin-top-left transition-all duration-200 ease-in-out z-10',
            ANIMATION_STATE_CLASSES,
            labelPlacementClasses,
            shiftedLabelPadding,
            disabled
              ? 'peer-focus:text-slate-400! data-[floating=true]:text-slate-400!'
              : labelColorStyles[color],
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>

        <ComboboxButton
          className={[
            'absolute right-0 flex items-center justify-center px-3 h-full',
            'transition-colors',
            disabled
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-600',
          ].join(' ')}
          aria-label="Toggle options"
        >
          <ChevronsUpDown size={currentSize.iconSize} aria-hidden="true" />
        </ComboboxButton>
      </div>

      <ComboboxOptions
        anchor="bottom start"
        transition
        className={[
          'z-50 w-(--input-width) overflow-auto rounded-md bg-white py-1 shadow-lg',
          'ring-1 ring-slate-200',
          'origin-top transition duration-150 ease-out',
          'empty:invisible',
          'data-closed:scale-95 data-closed:opacity-0',
          'max-h-60',
          '[--anchor-gap:4px]',
        ].join(' ')}
      >
        {showCreateOption && (
          <ComboboxOption value={query as unknown as T} className={optionClasses}>
            <span className="w-4 shrink-0" />
            <span className="flex-1 text-slate-500 italic">
              {renderCreateOption
                ? renderCreateOption(query)
                : <>Create &ldquo;{query}&rdquo;</>}
            </span>
          </ComboboxOption>
        )}

        {filteredOptions.length === 0 && !showCreateOption && (
          <div
            className={[
              'cursor-default select-none',
              currentSize.optionPy,
              currentSize.optionPx,
              currentSize.optionText,
              'text-slate-400 italic',
            ].join(' ')}
          >
            No options found
          </div>
        )}

        {filteredOptions.map((opt, idx) => (
          <ComboboxOption
            key={`${String(opt.value)}-${idx}`}
            value={opt.value}
            disabled={opt.disabled}
            className={optionClasses}
          >
            <span className="flex items-center w-4 shrink-0">
              <Check
                size={currentSize.checkSize}
                className="invisible [[data-selected]_&]:visible text-slate-700"
                aria-hidden="true"
              />
            </span>
            <span className="flex-1 truncate">{opt.label}</span>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </HeadlessCombobox>
  );
}