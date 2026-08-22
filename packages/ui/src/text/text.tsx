import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import {
  BG_CLASS,
  BORDER_CLASS,
  cn,
  MARGIN_CLASS,
  mergeRefs,
  PADDING_CLASS,
  TEXT_CLASS,
} from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, Spacing, ThemeColor } from '../shared/index.js';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type FontWeight = 'thin' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

// Spelled out literally so Tailwind's static scanner can see every class —
// see the note in shared/colors.ts.
const FONT_SIZE_CLASS: Record<FontSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const FONT_WEIGHT_CLASS: Record<FontWeight, string> = {
  thin: 'font-thin',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

export interface TextProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'p'>, 'className' | 'style' | 'color'> {
  children?: ReactNode;
  backgroundColor?: ThemeColor;
  textColor?: ThemeColor;
  borderColor?: ThemeColor;
  padding?: Spacing;
  margin?: Spacing;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  ref?: Ref<HTMLParagraphElement>;
}

export function Text({
  children,
  backgroundColor,
  textColor,
  borderColor,
  padding,
  margin,
  fontSize,
  fontWeight,
  animation,
  className,
  style,
  ref,
  ...rest
}: TextProps) {
  const animationProp = useAnimationProp(animation);

  return (
    <p
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLParagraphElement>)}
      className={cn(
        'm-0', // <p> carries a default browser margin; margin prop opts back in
        fontSize && FONT_SIZE_CLASS[fontSize],
        fontWeight && FONT_WEIGHT_CLASS[fontWeight],
        padding !== undefined && PADDING_CLASS[padding],
        margin !== undefined && MARGIN_CLASS[margin],
        backgroundColor && BG_CLASS[backgroundColor],
        textColor && TEXT_CLASS[textColor],
        borderColor && ['border', BORDER_CLASS[borderColor]],
        animationProp.className,
        className,
      )}
      style={{ ...animationProp.style, ...style }}
      {...rest}
    >
      {children}
    </p>
  );
}
