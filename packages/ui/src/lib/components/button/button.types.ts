import { ButtonProps as HeadlessButtonProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HeadlessButtonProps, 'onClick' | 'style'> {
  color?: ThemeColor;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: ButtonSize;
  rounded?: boolean;
  fullWidth?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  icon?: string;
  overrideClassName?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
}