import { ThemeColor, AnimationObject } from '@inithium/types';

export type BoxFlexDirection = 'row' | 'row-reverse' | 'col' | 'col-reverse';
export type BoxJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'stretch';
export type BoxAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
export type BoxPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BoxMargin = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'auto';
export type BoxBorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type BoxBorderWidth = 'none' | 'thin' | 'base' | 'thick';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: ThemeColor;
  flex?: boolean;
  direction?: BoxFlexDirection;
  justify?: BoxJustify;
  align?: BoxAlign;
  padding?: BoxPadding;
  margin?: BoxMargin;
  border?: boolean;
  borderWidth?: BoxBorderWidth;
  borderRadius?: BoxBorderRadius;
  fullWidth?: boolean;
  fullHeight?: boolean;
  animation?: AnimationObject;
  overrideClassName?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}