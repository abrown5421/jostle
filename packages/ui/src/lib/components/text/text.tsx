import React, { JSX } from 'react';
import { TextProps, TextVariant, TextDecorations } from './text.types';

const variantTagMap: Record<TextVariant, keyof JSX.IntrinsicElements> = {
  h1:        'h1',
  h2:        'h2',
  h3:        'h3',
  h5:        'h5',
  h6:        'h6',
  subtitle1: 'p',
  subtitle2: 'p',
  body:      'p',
  body2:     'p',
  caption:   'span',
};

const variantStyles: Record<TextVariant, string> = {
  h1:        'text-5xl leading-tight tracking-tight',
  h2:        'text-4xl leading-tight tracking-tight',
  h3:        'text-3xl leading-snug',
  h5:        'text-xl leading-snug',
  h6:        'text-lg leading-snug',
  subtitle1: 'text-base leading-normal',
  subtitle2: 'text-sm leading-normal',
  body:      'text-base leading-relaxed',
  body2:     'text-sm leading-relaxed',
  caption:   'text-xs leading-normal',
};

const variantDefaultWeights: Record<TextVariant, string> = {
  h1:        'font-bold',
  h2:        'font-bold',
  h3:        'font-semibold',
  h5:        'font-semibold',
  h6:        'font-semibold',
  subtitle1: 'font-medium',
  subtitle2: 'font-medium',
  body:      'font-normal',
  body2:     'font-normal',
  caption:   'font-normal',
};

const COLOR_CLASS_MAP: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  surface: 'text-surface',
  surface2: 'text-surface2',
  surface3: 'text-surface3',
  surface4: 'text-surface4',
  'primary-contrast': 'text-primary-contrast',
  'secondary-contrast': 'text-secondary-contrast',
  'accent-contrast': 'text-accent-contrast',
  'success-contrast': 'text-success-contrast',
  'warning-contrast': 'text-warning-contrast',
  'danger-contrast': 'text-danger-contrast',
  'surface-contrast': 'text-surface-contrast',
  'surface2-contrast': 'text-surface2-contrast',
  'surface3-contrast': 'text-surface3-contrast',
  'surface4-contrast': 'text-surface4-contrast',
};

const CLASS_CATEGORIES: Array<{ prefix: string; propClasses: (variant: TextVariant, decoration?: TextDecorations) => string[] }> = [
  {
    prefix: 'text-',
    propClasses: (_, __) => Object.values(COLOR_CLASS_MAP),
  },
  {
    prefix: 'font-',
    propClasses: (variant, decoration) => {
      const weight = decoration?.bold ? 'font-bold' : variantDefaultWeights[variant];
      return [weight];
    },
  },
  {
    // italic
    prefix: 'italic',
    propClasses: (_, decoration) => decoration?.italic ? ['italic'] : [],
  },
  {
    prefix: 'underline',
    propClasses: (_, decoration) => decoration?.underline ? ['underline'] : [],
  },
];

function overriddenCategories(overrideClassName: string): Set<string> {
  const overrides = overrideClassName.split(/\s+/).filter(Boolean);
  const covered = new Set<string>();
  for (const cls of overrides) {
    for (const { prefix } of CLASS_CATEGORIES) {
      if (cls === prefix || cls.startsWith(prefix)) {
        covered.add(prefix);
      }
    }
  }
  return covered;
}

const BASE = 'inline-block';

function buildClasses(
  color: string,
  variant: TextVariant,
  decoration: TextDecorations | undefined,
  font: string | undefined,
  overrideClassName?: string,
): string {
  const weight   = decoration?.bold ? 'font-bold' : variantDefaultWeights[variant];
  const colorCls = COLOR_CLASS_MAP[color] ?? 'text-primary';

  const propDriven = [
    BASE,
    variantStyles[variant],
    weight,
    colorCls,
    decoration?.italic    ? 'italic'    : '',
    decoration?.underline ? 'underline' : '',
    font ? `font-[${font}]` : '',
  ].filter(Boolean);

  if (!overrideClassName) {
    return propDriven.join(' ').trim();
  }

  const covered = overriddenCategories(overrideClassName);

  const filtered = propDriven.filter((cls) => {
    for (const { prefix, propClasses } of CLASS_CATEGORIES) {
      if (covered.has(prefix) && propClasses(variant, decoration).includes(cls)) {
        return false;
      }
    }
    return true;
  });

  return [...filtered, overrideClassName].join(' ').trim();
}

export const Text: React.FC<React.PropsWithChildren<TextProps>> = ({
  color = 'primary',
  variant = 'body',
  decoration,
  font,
  overrideClassName,
  style,
  children,
  ...props
}) => {
  const Tag = variantTagMap[variant];

  const resolvedClassName = buildClasses(
    color,
    variant,
    decoration,
    font,
    overrideClassName,
  );

  return (
    <Tag className={resolvedClassName} style={style} {...props}>
      {children}
    </Tag>
  );
};