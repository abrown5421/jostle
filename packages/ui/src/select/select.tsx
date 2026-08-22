import { useId } from 'react';
import type { ComponentPropsWithoutRef, Ref } from 'react';
import { Container } from '../container/index.js';
import { cn, FOCUS_RING_CLASS } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, BrandColor } from '../shared/index.js';

const BASE_SELECT_CLASS =
  'w-full rounded-md border border-content-tertiary bg-transparent px-3 py-2 text-content-primary focus:outline-none focus:ring-2 transition-colors';

const LABEL_CLASS = 'text-sm font-medium text-content-secondary';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'select'>, 'className' | 'style' | 'color' | 'value' | 'onChange'> {
  value: string;
  setValue: (value: string) => void;
  options: SelectOption[];
  /** Focus-ring color. @default 'primary' */
  color?: BrandColor;
  label?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function Select({
  value,
  setValue,
  options,
  color = 'primary',
  label,
  animation,
  className,
  style,
  ref,
  id,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Container direction="col" gap={1} animation={animation} className={className} style={style}>
      {label && (
        <label htmlFor={selectId} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={cn(BASE_SELECT_CLASS, FOCUS_RING_CLASS[color])}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Container>
  );
}
