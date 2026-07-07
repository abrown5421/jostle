import { SwitchProps as HeadlessSwitchProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<HeadlessSwitchProps, 'size' | 'color'> {
  label?: string;
  color?: ThemeColor;
  size?: SwitchSize;
}