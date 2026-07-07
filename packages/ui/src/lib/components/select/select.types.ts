import { SelectProps as HeadlessSelectProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<HeadlessSelectProps, 'style' | 'onChange' | 'size'> {
  label: string;
  options: SelectOption[];
  color?: ThemeColor;
  variant?: 'outline' | 'filled' | 'standard';
  size?: SelectSize;
  rounded?: boolean;
  fullWidth?: boolean;
  leadingIcon?: string;
  overrideClassName?: string;
  style?: React.CSSProperties;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => unknown;
}