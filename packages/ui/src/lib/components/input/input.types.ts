import { InputProps as HeadlessInputProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<HeadlessInputProps, 'style' | 'onChange' | 'size'> {
  label: string;
  color?: ThemeColor;
  variant?: 'outline' | 'filled' | 'standard';
  size?: InputSize;
  rounded?: boolean;
  fullWidth?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  overrideClassName?: string;
  style?: React.CSSProperties;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
}