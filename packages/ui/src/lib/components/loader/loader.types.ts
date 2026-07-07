import { ThemeColor } from "@inithium/types";

export type LoaderVariant = 'spinner' | 'dots' | 'bar' | 'pulse';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: ThemeColor;
  overrideClassName?: string;
}
