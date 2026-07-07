import React, { Fragment, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';
import { DynamicIcon } from 'lucide-react/dynamic';

import { ThemeColorPickerProps } from './theme-color-picker.types';

const THEME_COLORS: readonly ThemeColor[] = [
  'primary',
  'primary-contrast',
  'secondary',
  'secondary-contrast',
  'accent',
  'accent-contrast',
  'success',
  'success-contrast',
  'warning',
  'warning-contrast',
  'danger',
  'danger-contrast',
  'surface',
  'surface-contrast',
  'surface2',
  'surface2-contrast',
  'surface3',
  'surface3-contrast',
  'surface4',
  'surface4-contrast',
];

const formatLabel = (color: string): string =>
  color
    .split('-')
    .map((word) => (word === 'contrast' ? '-contrast' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
    .replace(/\s-/, ' -');

const generateColorOptions = () =>
  THEME_COLORS.map((color) => ({
    value: color,
    label: formatLabel(color),
    bgClass: `bg-${color}`,
  }));

const Swatch: React.FC<{ bgClass: string }> = ({ bgClass }) => (
  <span
    className={[
      'inline-block h-4 w-4 shrink-0 rounded-sm',
      'border border-surface-contrast',
      bgClass,
    ]
      .filter(Boolean)
      .join(' ')}
    aria-hidden="true"
  />
);

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  label = 'Select Theme Color',
  value,
  defaultValue,
  onChange,
  disabled,
  ...props
}) => {
  const options = useMemo(generateColorOptions, []);

  const selectedOption = useMemo(() => {
    const activeValue = value ?? defaultValue;
    return options.find((opt) => opt.value === activeValue) || options[0];
  }, [value, defaultValue, options]);

  const CONTAINER_CLASSES = [
    'relative h-12 w-72 transition-all duration-200',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const BUTTON_CLASSES = [
    'peer flex h-full w-full items-center justify-between gap-3',
    'rounded-md border border-slate-300 bg-transparent px-4 pb-1.5 pt-5 text-base',
    'text-slate-900 outline-hidden transition-all duration-200 ease-in-out',
    'focus:border-2 focus:border-primary focus:ring-primary focus:pb-[5px] focus:pt-[19px]',
    disabled ? 'border-slate-200! bg-slate-100! select-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const LABEL_CLASSES = [
    'absolute pointer-events-none origin-top-left transition-all duration-200 ease-in-out z-10',
    'left-4 top-0.5 text-xs text-slate-400 peer-focus:text-primary',
    disabled ? 'peer-focus:text-slate-400!' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Listbox
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      {...props}
    >
      {({ open }) => (
        <div className={CONTAINER_CLASSES}>
          <Listbox.Button className={BUTTON_CLASSES}>
            <span className="block truncate">{selectedOption?.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              {selectedOption && <Swatch bgClass={selectedOption.bgClass} />}
              <DynamicIcon
                name="chevron-down"
                size={18}
                className={`transition-colors ${open ? 'text-slate-600' : 'text-slate-400'}`}
              />
            </div>
          </Listbox.Button>

          <label className={LABEL_CLASSES}>{label}</label>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-hidden z-20">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    [
                      'relative cursor-default select-none py-2 pl-4 pr-10',
                      'transition-colors duration-150',
                      active ? 'bg-primary text-primary-contrast' : 'text-slate-900',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        <Swatch bgClass={option.bgClass} />
                      </div>
                      {selected && (
                        <span
                          className={`absolute inset-y-0 right-0 flex items-center pr-3 ${active ? 'text-primary-contrast' : 'text-primary'}`}
                        >
                          <DynamicIcon name="check" size={16} />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};