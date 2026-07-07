import { CheckboxProps as HeadlessCheckboxProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<HeadlessCheckboxProps, 'size' | 'color'> {
  label?: string;
  color?: ThemeColor;
  size?: CheckboxSize;
}