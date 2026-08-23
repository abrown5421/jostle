import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { Container } from '../container/index.js';
import { cn, FOCUS_RING_CLASS } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps, BrandColor } from '../shared/index.js';

const BASE_INPUT_CLASS =
  'w-full rounded-md border border-content-tertiary bg-transparent px-3 py-2 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 transition-colors';

const LABEL_CLASS = 'text-sm font-medium text-content-secondary';

export interface InputProps
  extends BlowoffProps,
    AnimatableProps,
    Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'style' | 'color' | 'value' | 'onChange'> {
  value: string;
  setValue: (value: string) => void;
  /** Focus-ring color. @default 'primary' */
  color?: BrandColor;
  label?: string;
  /** Rendered inside the input's right edge — e.g. a password-visibility toggle. */
  trailingElement?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  value,
  setValue,
  color = 'primary',
  label,
  trailingElement,
  animation,
  className,
  style,
  ref,
  id,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Container direction="col" gap={1} animation={animation} className={className} style={style}>
      {label && (
        <label htmlFor={inputId} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          ref={ref}
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cn(BASE_INPUT_CLASS, trailingElement && 'pr-10', FOCUS_RING_CLASS[color])}
          {...rest}
        />
        {trailingElement && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{trailingElement}</div>}
      </div>
    </Container>
  );
}
