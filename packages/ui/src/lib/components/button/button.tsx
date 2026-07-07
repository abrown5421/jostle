import React from 'react';
import { Button as HeadlessButton } from '@headlessui/react';
import * as LucideIcons from 'lucide-react';
import { ButtonProps, ButtonSize } from './button.types';

type ColorKey = NonNullable<ButtonProps['color']>;
type VariantKey = NonNullable<ButtonProps['variant']>;

function resolveIcon(name: string): React.ElementType | null {
  const pascal = name
    .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());

  const candidate = (LucideIcons as Record<string, unknown>)[pascal];

  if (candidate === null || candidate === undefined) return null;
  if (typeof candidate === 'function') return candidate as React.ElementType;
  if (typeof candidate === 'object' && '$$typeof' in (candidate as object)) {
    return candidate as React.ElementType;
  }

  return null;
}

const variantStyles: Record<VariantKey, (color: ColorKey) => string> = {
  solid: (color) =>
    `border-3 transition-all duration-250 ease-in-out bg-${color} text-${color}-contrast border-${color} ` +
    `hover:cursor-pointer hover:bg-${color}-contrast hover:text-${color}`,

  outline: (color) =>
    `border-3 transition-all duration-250 ease-in-out bg-${color}-contrast text-${color} border-${color} ` +
    `hover:cursor-pointer hover:bg-${color} hover:text-${color}-contrast`,

  ghost: (color) =>
    `border-3 transition-all duration-250 ease-in-out bg-transparent text-${color} border-transparent ` +
    `hover:cursor-pointer hover:border-b-${color}`,
};

const sizeStyles: Record<ButtonSize, { box: string; text: string; iconSize: number }> = {
  xs: { box: 'px-2 py-1',    text: 'text-xs',   iconSize: 12 },
  sm: { box: 'px-3 py-1.5',  text: 'text-sm',   iconSize: 14 },
  md: { box: 'px-4 py-2',    text: 'text-sm',   iconSize: 16 },
  lg: { box: 'px-5 py-2.5',  text: 'text-base', iconSize: 18 },
  xl: { box: 'px-6 py-3',    text: 'text-lg',   iconSize: 20 },
};

const iconOnlySizeStyles: Record<ButtonSize, string> = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
  xl: 'p-3',
};

const roundedStyles: Record<string, string> = {
  true:  'rounded-md',
  false: 'rounded-none',
};

const BASE =
  'inline-flex items-center justify-center font-medium ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

function buildClasses(
  color: ColorKey,
  variant: VariantKey,
  size: ButtonSize,
  rounded: boolean,
  isIconOnly: boolean,
  fullWidth: boolean,
  extra: string,
  overrideClassName?: string,
): string {
  if (overrideClassName !== undefined) {
    return [BASE, overrideClassName].filter(Boolean).join(' ').trim();
  }

  return [
    BASE,
    isIconOnly ? iconOnlySizeStyles[size] : sizeStyles[size].box,
    sizeStyles[size].text,
    variantStyles[variant](color),
    roundedStyles[String(rounded)],
    fullWidth ? 'w-full' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

interface IconNodeProps {
  name: string;
  size: number;
  className?: string;
}

const IconNode: React.FC<IconNodeProps> = ({ name, size, className }) => {
  const Icon = resolveIcon(name);
  if (!Icon) return null;
  return <Icon size={size} className={className} aria-hidden="true" />;
};

export const Button: React.FC<ButtonProps> = ({
  color = 'primary',
  variant = 'solid',
  size = 'md',
  rounded = true,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  icon,
  className,
  overrideClassName,
  style,
  children,
  onClick,
  ...props
}) => {
  const { iconSize } = sizeStyles[size];
  const isIconOnly = Boolean(icon);

  const resolvedClassName =
    typeof className === 'function'
      ? (bag: Parameters<Extract<typeof className, Function>>[0]) =>
          buildClasses(
            color, variant, size, rounded, isIconOnly,
            fullWidth,
            className(bag),
            overrideClassName,
          )
      : buildClasses(
          color, variant, size, rounded, isIconOnly,
          fullWidth,
          className ?? '',
          overrideClassName,
        );

  return (
    <HeadlessButton
      className={resolvedClassName}
      style={style}
      onClick={onClick}
      {...props}
    >
      {isIconOnly ? (
        <IconNode name={icon!} size={iconSize} />
      ) : (
        <>
          {leadingIcon && (
            <IconNode
              name={leadingIcon}
              size={iconSize}
              className={children ? 'mr-1.5' : undefined}
            />
          )}

          {children}

          {trailingIcon && (
            <IconNode
              name={trailingIcon}
              size={iconSize}
              className={children ? 'ml-1.5' : undefined}
            />
          )}
        </>
      )}
    </HeadlessButton>
  );
};