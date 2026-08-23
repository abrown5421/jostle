import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import { cn, mergeRefs } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, BrandColor } from '../shared/index.js';

export type ButtonVariant = 'contained' | 'outlined' | 'ghost' | 'link';

const BASE_CLASS = 'inline-flex items-center justify-center font-medium disabled:cursor-not-allowed disabled:opacity-60';

// link reads as inline text, not a button — no padding/rounding to fake a
// hit target the way the other three (real, boxed) variants need.
const VARIANT_SHAPE_CLASS: Record<ButtonVariant, string> = {
  contained: 'rounded-md px-4 py-2',
  outlined: 'rounded-md px-4 py-2',
  ghost: 'rounded-md px-4 py-2',
  link: '',
};

// Every class name has to appear literally for Tailwind's scanner to pick
// it up — `bg-${color}` built at render time is invisible to it — so each
// variant x color combination is spelled out in full rather than composed
// from a template string. See shared/colors.ts for the general version of
// this note.
const VARIANT_COLOR_CLASS: Record<ButtonVariant, Record<BrandColor, string>> = {
  contained: {
    primary:
      'bg-primary text-primary-foreground border border-1 border-primary hover:bg-transparent hover:text-primary transition-all',
    secondary:
      'bg-secondary text-secondary-foreground border border-1 border-secondary hover:bg-transparent hover:text-secondary transition-all',
    accent:
      'bg-accent text-accent-foreground border border-1 border-accent hover:bg-transparent hover:text-accent transition-all',
  },
  outlined: {
    primary:
      'bg-transparent text-primary border border-1 border-primary hover:bg-primary hover:text-primary-foreground transition-all',
    secondary:
      'bg-transparent text-secondary border border-1 border-secondary hover:bg-secondary hover:text-secondary-foreground transition-all',
    accent:
      'bg-transparent text-accent border border-1 border-accent hover:bg-accent hover:text-accent-foreground transition-all',
  },
  ghost: {
    primary: 'bg-transparent text-primary border-b-1 border-transparent hover:border-primary transition-colors',
    secondary: 'bg-transparent text-secondary border-b-1 border-transparent hover:border-secondary transition-colors',
    accent: 'bg-transparent text-accent border-b-1 border-transparent hover:border-accent transition-colors',
  },
  link: {
    primary: 'text-primary hover:underline cursor-pointer',
    secondary: 'text-secondary hover:underline cursor-pointer',
    accent: 'text-accent hover:underline cursor-pointer',
  },
};

export interface ButtonProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'style' | 'color'> {
  children?: ReactNode;
  /** @default 'primary' */
  color?: BrandColor;
  /** @default 'contained' */
  variant?: ButtonVariant;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  children,
  color = 'primary',
  variant = 'contained',
  disabled,
  animation,
  className,
  style,
  ref,
  type = 'button',
  ...rest
}: ButtonProps) {
  const animationProp = useAnimationProp(animation);

  return (
    <button
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLButtonElement>)}
      type={type}
      disabled={disabled}
      className={cn(
        BASE_CLASS,
        VARIANT_SHAPE_CLASS[variant],
        VARIANT_COLOR_CLASS[variant][color],
        animationProp.className,
        className,
      )}
      style={{ ...animationProp.style, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
