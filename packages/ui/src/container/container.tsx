import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import {
  BG_CLASS,
  BORDER_CLASS,
  cn,
  GAP_CLASS,
  MARGIN_CLASS,
  mergeRefs,
  PADDING_CLASS,
  TEXT_CLASS,
} from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, Spacing, ThemeColor } from '../shared/index.js';

export type FlexDirection = 'row' | 'col';

/** Alignment along one flex axis. Not every value is meaningful on every
 * axis (e.g. `baseline` only applies cross-axis) — see the class maps
 * below for which combinations actually emit a class. */
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around' | 'evenly' | 'baseline';

const DIRECTION_CLASS: Record<FlexDirection, string> = {
  row: 'flex-row',
  col: 'flex-col',
};

// justify-* (main axis) and items-* (cross axis) support different value
// sets, and which prop lands on which axis depends on `direction` — see
// mainAxisAlign/crossAxisAlign below. Partial + a lookup miss means "no
// class emitted" rather than producing an invalid class name.
const JUSTIFY_CLASS: Partial<Record<Align, string>> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  stretch: 'justify-stretch',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const ITEMS_CLASS: Partial<Record<Align, string>> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

export interface ContainerProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'style' | 'color'> {
  children?: ReactNode;
  backgroundColor?: ThemeColor;
  textColor?: ThemeColor;
  borderColor?: ThemeColor;
  /** @default 'row' */
  direction?: FlexDirection;
  /** Alignment along the X axis, regardless of `direction`. */
  horizontalAlign?: Align;
  /** Alignment along the Y axis, regardless of `direction`. */
  verticalAlign?: Align;
  gap?: Spacing;
  padding?: Spacing;
  margin?: Spacing;
  ref?: Ref<HTMLDivElement>;
}

export function Container({
  children,
  backgroundColor,
  textColor,
  borderColor,
  direction = 'row',
  horizontalAlign,
  verticalAlign,
  gap,
  padding,
  margin,
  animation,
  className,
  style,
  ref,
  ...rest
}: ContainerProps) {
  const animationProp = useAnimationProp(animation);

  const mainAxisAlign = direction === 'row' ? horizontalAlign : verticalAlign;
  const crossAxisAlign = direction === 'row' ? verticalAlign : horizontalAlign;

  return (
    <div
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLDivElement>)}
      className={cn(
        'flex',
        DIRECTION_CLASS[direction],
        mainAxisAlign && JUSTIFY_CLASS[mainAxisAlign],
        crossAxisAlign && ITEMS_CLASS[crossAxisAlign],
        gap !== undefined && GAP_CLASS[gap],
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
    </div>
  );
}
