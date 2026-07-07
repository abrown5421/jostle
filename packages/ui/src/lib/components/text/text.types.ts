import { ThemeColor } from '@inithium/types';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body'
  | 'body2'
  | 'caption';

export interface TextDecorations {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface TextProps {
  color?: ThemeColor;
  variant?: TextVariant;
  decoration?: TextDecorations;
  font?: string;
  overrideClassName?: string;
  style?: React.CSSProperties;
}