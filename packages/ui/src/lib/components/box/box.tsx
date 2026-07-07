import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { BoxProps, BoxFlexDirection, BoxJustify, BoxAlign, BoxBorderRadius, BoxBorderWidth } from './box.types';
import { AnimationPhase } from '@inithium/types';

type ColorKey = NonNullable<BoxProps['color']>;

const colorStyles: Record<ColorKey, string> = {
  'primary':            'bg-primary text-primary-contrast',
  'primary-contrast':   'bg-primary-contrast text-primary',
  'secondary':          'bg-secondary text-secondary-contrast',
  'secondary-contrast': 'bg-secondary-contrast text-secondary',
  'accent':             'bg-accent text-accent-contrast',
  'accent-contrast':    'bg-accent-contrast text-accent',
  'success':            'bg-success text-success-contrast',
  'success-contrast':   'bg-success-contrast text-success',
  'warning':            'bg-warning text-warning-contrast',
  'warning-contrast':   'bg-warning-contrast text-warning',
  'danger':             'bg-danger text-danger-contrast',
  'danger-contrast':    'bg-danger-contrast text-danger',
  'surface':            'bg-surface text-surface-contrast',
  'surface-contrast':   'bg-surface-contrast text-surface',
  'surface2':           'bg-surface2 text-surface2-contrast',
  'surface2-contrast':  'bg-surface2-contrast text-surface2',
  'surface3':           'bg-surface3 text-surface3-contrast',
  'surface3-contrast':  'bg-surface3-contrast text-surface3',
  'surface4':           'bg-surface4 text-surface4-contrast',
  'surface4-contrast':  'bg-surface4-contrast text-surface4',
};

const borderColorStyles: Record<ColorKey, string> = {
  'primary':            'border-primary',
  'primary-contrast':   'border-primary-contrast',
  'secondary':          'border-secondary',
  'secondary-contrast': 'border-secondary-contrast',
  'accent':             'border-accent',
  'accent-contrast':    'border-accent-contrast',
  'success':            'border-success',
  'success-contrast':   'border-success-contrast',
  'warning':            'border-warning',
  'warning-contrast':   'border-warning-contrast',
  'danger':             'border-danger',
  'danger-contrast':    'border-danger-contrast',
  'surface':            'border-surface-contrast',
  'surface-contrast':   'border-surface',
  'surface2':           'border-surface2-contrast',
  'surface2-contrast':  'border-surface2',
  'surface3':           'border-surface3-contrast',
  'surface3-contrast':  'border-surface3',
  'surface4':           'border-surface4-contrast',
  'surface4-contrast':  'border-surface4',
};

const flexDirectionStyles: Record<BoxFlexDirection, string> = {
  'row':         'flex-row',
  'row-reverse': 'flex-row-reverse',
  'col':         'flex-col',
  'col-reverse': 'flex-col-reverse',
};

const justifyStyles: Record<BoxJustify, string> = {
  'start':   'justify-start',
  'end':     'justify-end',
  'center':  'justify-center',
  'between': 'justify-between',
  'around':  'justify-around',
  'evenly':  'justify-evenly',
  'stretch': 'justify-stretch',
};

const alignStyles: Record<BoxAlign, string> = {
  'start':    'items-start',
  'end':      'items-end',
  'center':   'items-center',
  'baseline': 'items-baseline',
  'stretch':  'items-stretch',
};

const paddingStyles: Record<NonNullable<BoxProps['padding']>, string> = {
  'none': 'p-0',
  'xs':   'p-1',
  'sm':   'p-2',
  'md':   'p-4',
  'lg':   'p-6',
  'xl':   'p-8',
  '2xl':  'p-12',
};

const marginStyles: Record<NonNullable<BoxProps['margin']>, string> = {
  'none': 'm-0',
  'xs':   'm-1',
  'sm':   'm-2',
  'md':   'm-4',
  'lg':   'm-6',
  'xl':   'm-8',
  '2xl':  'm-12',
  'auto': 'm-auto',
};

const borderRadiusStyles: Record<BoxBorderRadius, string> = {
  'none': 'rounded-none',
  'sm':   'rounded-sm',
  'md':   'rounded-md',
  'lg':   'rounded-lg',
  'xl':   'rounded-xl',
  'full': 'rounded-full',
};

const borderWidthStyles: Record<BoxBorderWidth, string> = {
  'none':  'border-0',
  'thin':  'border',
  'base':  'border-2',
  'thick': 'border-4',
};

function buildAnimationClasses(phase: AnimationPhase, animation?: BoxProps['animation']): string {
  if (!animation) return '';
  if (phase === 'idle' || phase === 'entered') return '';

  const classes = ['animate__animated'];

  if (phase === 'entering') {
    classes.push(`animate__${animation.entry}`);
    if (animation.entryDelay) classes.push(`animate__${animation.entryDelay}`);
    if (animation.entrySpeed) classes.push(`animate__${animation.entrySpeed}`);
  }

  if (phase === 'exiting') {
    classes.push(`animate__${animation.exit}`);
    if (animation.exitDelay) classes.push(`animate__${animation.exitDelay}`);
    if (animation.exitSpeed) classes.push(`animate__${animation.exitSpeed}`);
  }

  return classes.join(' ');
}

function buildClasses(
  color: ColorKey | undefined,
  flex: boolean,
  direction: BoxFlexDirection,
  justify: BoxJustify,
  align: BoxAlign,
  padding: NonNullable<BoxProps['padding']>,
  margin: NonNullable<BoxProps['margin']>,
  border: boolean,
  borderWidth: BoxBorderWidth,
  borderRadius: BoxBorderRadius,
  fullWidth: boolean,
  fullHeight: boolean,
  animationClasses: string,
  extra: string,
  overrideClassName?: string,
): string {
  if (overrideClassName !== undefined) {
    return [overrideClassName, animationClasses].filter(Boolean).join(' ').trim();
  }

  return [
    color ? colorStyles[color] : '',
    flex ? 'flex' : '',
    flex ? flexDirectionStyles[direction] : '',
    flex ? justifyStyles[justify] : '',
    flex ? alignStyles[align] : '',
    paddingStyles[padding],
    marginStyles[margin],
    border ? borderWidthStyles[borderWidth] : '',
    border && color ? borderColorStyles[color] : '',
    borderRadiusStyles[borderRadius],
    fullWidth ? 'w-full' : '',
    fullHeight ? 'h-full' : '',
    animationClasses,
    extra,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(({
  color,
  flex = false,
  direction = 'row',
  justify = 'start',
  align = 'stretch',
  padding = 'none',
  margin = 'none',
  border = false,
  borderWidth = 'base',
  borderRadius = 'none',
  fullWidth = false,
  fullHeight = false,
  animation,
  className,
  overrideClassName,
  style,
  children,
  ...props
}, forwardedRef) => {
  const [phase, setPhase] = useState<AnimationPhase>(() =>
    animation ? 'entering' : 'entered'
  );
  const innerRef = useRef<HTMLDivElement>(null);

  // Merge forwarded ref with internal ref
  const ref = (forwardedRef ?? innerRef) as React.RefObject<HTMLDivElement>;

  useEffect((): (() => void) | void => {
    if (!animation) return;

    if (animation.controller) {
      animation.controller.phase = phase;
    }

    if (phase === 'entering') {
      const el = ref.current;
      if (!el) return;

      const onEnd = () => setPhase('entered');
      el.addEventListener('animationend', onEnd, { once: true });
      return () => el.removeEventListener('animationend', onEnd);
    }
  }, [phase, animation]);

  useEffect((): void => {
    if (!animation?.controller) return;

    animation.controller.triggerExit = () =>
      new Promise<void>((resolve) => {
        setPhase('exiting');
        const el = ref.current;
        if (!el) { resolve(); return; }
        const onEnd = () => { setPhase('idle'); resolve(); };
        el.addEventListener('animationend', onEnd, { once: true });
      });

    animation.controller.triggerEnter = () => setPhase('entering');
    animation.controller.reset = () => setPhase('idle');
  }, [animation]);

  const animationClasses = buildAnimationClasses(phase, animation);

  const resolvedClassName = buildClasses(
    color,
    flex,
    direction,
    justify,
    align,
    padding,
    margin,
    border,
    borderWidth,
    borderRadius,
    fullWidth,
    fullHeight,
    animationClasses,
    typeof className === 'string' ? className : '',
    overrideClassName,
  );

  if (phase === 'idle') return null;

  return (
    <div
      ref={ref}
      className={resolvedClassName}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
});

Box.displayName = 'Box';