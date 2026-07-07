import React from 'react';
import { ThemeColor } from '@inithium/types';

export type SliderSize = 'sm' | 'md' | 'lg';
export type SliderOrientation = 'horizontal' | 'vertical';

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'color'> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  color?: ThemeColor;
  size?: SliderSize;
  orientation?: SliderOrientation;
  showTooltip?: boolean;
  showTicks?: boolean;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  fullWidth?: boolean;
  overrideClassName?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}