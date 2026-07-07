import { ThemeColor } from '@inithium/types';

export type ComboboxSize = 'sm' | 'md' | 'lg';

export interface ComboboxOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps<T = string> {
  value?: T | null;
  defaultValue?: T;
  onChange?: (value: T | null) => void;
  onClose?: () => void;
  by?: keyof T | ((a: T, z: T) => boolean);
  options: ComboboxOption<T>[];
  label: string;
  color?: ThemeColor;
  variant?: 'outline' | 'filled' | 'standard';
  size?: ComboboxSize;
  rounded?: boolean;
  fullWidth?: boolean;
  leadingIcon?: string;
  className?: string;
  overrideClassName?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  invalid?: boolean;
  immediate?: boolean;
  name?: string;
  onQueryChange?: (query: string) => void;
  allowCustomValue?: boolean;
  renderCreateOption?: (query: string) => React.ReactNode;
}