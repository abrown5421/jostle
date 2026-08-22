import type { ComponentPropsWithoutRef, Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import { BG_CLASS, cn, mergeRefs } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, BrandColor } from '../shared/index.js';

const TRACK_BASE_CLASS =
  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary';
const TRACK_OFF_CLASS = 'bg-surface-tertiary';

const THUMB_BASE_CLASS = 'inline-block h-4 w-4 transform rounded-full bg-content-primary transition-transform';
const THUMB_ON_CLASS = 'translate-x-6';
const THUMB_OFF_CLASS = 'translate-x-1';

export interface SwitchProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'style' | 'color' | 'onClick' | 'value'> {
  value: boolean;
  setValue: (value: boolean) => void;
  /** Track color while `value` is true. @default 'primary' */
  color?: BrandColor;
  label?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function Switch({
  value,
  setValue,
  color = 'primary',
  label,
  animation,
  className,
  style,
  ref,
  id,
  ...rest
}: SwitchProps) {
  const animationProp = useAnimationProp(animation);

  const track = (
    <button
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLButtonElement>)}
      id={id}
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => setValue(!value)}
      className={cn(
        TRACK_BASE_CLASS,
        value ? BG_CLASS[color] : TRACK_OFF_CLASS,
        animationProp.className,
        className,
      )}
      style={{ ...animationProp.style, ...style }}
      {...rest}
    >
      <span className={cn(THUMB_BASE_CLASS, value ? THUMB_ON_CLASS : THUMB_OFF_CLASS)} />
    </button>
  );

  if (!label) return track;

  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm font-medium text-content-secondary">
      {track}
      {label}
    </label>
  );
}
