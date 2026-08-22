/**
 * Brand colors: the three action/accent tokens from theme.css, used
 * wherever a component takes a single `color` prop (Button, Input,
 * Select, Switch, Slider).
 */
export type BrandColor = 'primary' | 'secondary' | 'accent';

/** Elevation steps for backgrounds. */
export type SurfaceColor = 'surface-primary' | 'surface-secondary' | 'surface-tertiary';

/** Text/foreground steps. */
export type ContentColor = 'content-primary' | 'content-secondary' | 'content-tertiary';

/**
 * The full palette Container/Text can point their independent
 * bg/text/border props at.
 */
export type ThemeColor = BrandColor | SurfaceColor | ContentColor;

// Tailwind's scanner needs each class name to appear as a complete,
// literal string somewhere in source — `bg-${color}` built at runtime is
// invisible to it. These Records exist so every variant is spelled out.
export const BG_CLASS: Record<ThemeColor, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  'surface-primary': 'bg-surface-primary',
  'surface-secondary': 'bg-surface-secondary',
  'surface-tertiary': 'bg-surface-tertiary',
  'content-primary': 'bg-content-primary',
  'content-secondary': 'bg-content-secondary',
  'content-tertiary': 'bg-content-tertiary',
};

export const TEXT_CLASS: Record<ThemeColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  'surface-primary': 'text-surface-primary',
  'surface-secondary': 'text-surface-secondary',
  'surface-tertiary': 'text-surface-tertiary',
  'content-primary': 'text-content-primary',
  'content-secondary': 'text-content-secondary',
  'content-tertiary': 'text-content-tertiary',
};

export const BORDER_CLASS: Record<ThemeColor, string> = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  accent: 'border-accent',
  'surface-primary': 'border-surface-primary',
  'surface-secondary': 'border-surface-secondary',
  'surface-tertiary': 'border-surface-tertiary',
  'content-primary': 'border-content-primary',
  'content-secondary': 'border-content-secondary',
  'content-tertiary': 'border-content-tertiary',
};
