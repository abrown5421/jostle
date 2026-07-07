import { JSX } from 'react';
import { LoaderProps, LoaderSize, LoaderVariant } from './loader.types';
import { ThemeColor } from '@inithium/types';

const colorStyles: Record<ThemeColor, string> = {
  'primary': 'text-primary border-primary',
  'secondary': 'text-secondary border-secondary',
  'accent': 'text-accent border-accent',
  'success': 'text-success border-success',
  'warning': 'text-warning border-warning',
  'danger':  'text-danger border-danger',
  'surface': 'text-surface border-surface',
  'surface2': 'text-surface2 border-surface2',
  'surface3': 'text-surface3 border-surface3',
  'surface4': 'text-surface4 border-surface4',
  'primary-contrast' : 'text-primary-contrast border-primary-contrast',
  'secondary-contrast' : 'text-secondary-contrast border-secondary-contrast',
  'accent-contrast' : 'text-accent-contrast border-accent-contrast',
  'success-contrast' : 'text-success-contrast border-success-contrast',
  'warning-contrast' : 'text-warning-contrast border-warning-contrast',
  'danger-contrast' : 'text-danger-contrast border-danger-contrast',
  'surface-contrast': 'text-surface-contrast border-surface-contrast',
  'surface2-contrast': 'text-surface2-contrast border-surface2-contrast',
  'surface3-contrast': 'text-surface3-contrast border-surface3-contrast',
  'surface4-contrast': 'text-surface4-contrast border-surface4-contrast',
};

const sizeStyles: Record<LoaderVariant, Record<LoaderSize, string>> = {
  spinner: {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  },
  dots: {
    xs: 'w-1.5 h-1.5 gap-1',
    sm: 'w-2 h-2 gap-1',
    md: 'w-3 h-3 gap-1.5',
    lg: 'w-4 h-4 gap-2',
    xl: 'w-5 h-5 gap-2',
  },
  bar: {
    xs: 'h-0.5 w-12',
    sm: 'h-1 w-16',
    md: 'h-1.5 w-24',
    lg: 'h-2 w-32',
    xl: 'h-3 w-40',
  },
  pulse: {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  },
};

const renderSpinner = (sizeClass: string, colorClass: string): JSX.Element => (
  <div 
    className={`inline-block animate-spin rounded-full border-t-transparent border-r-transparent ${sizeClass} ${colorClass}`} 
    role="status"
  />
);

const renderDots = (sizeClass: string, colorClass: string): JSX.Element => {
  const parts = sizeClass.split(' ');
  const wClass = parts[0]; 
  const hClass = parts[1]; 
  const gapClass = parts[2] ?? 'gap-1';
  const dotBase = `flex-shrink-0 rounded-full bg-current animate-bounce ${wClass} ${hClass}`;
  
  return (
    <div className={`flex items-end justify-center ${gapClass} ${colorClass} h-7`} role="status">
        <div className={dotBase} style={{ animationDelay: '0s' }} />
        <div className={dotBase} style={{ animationDelay: '0.15s' }} />
        <div className={dotBase} style={{ animationDelay: '0.3s' }} />
    </div>
  );
};

const renderBar = (sizeClass: string, colorClass: string): JSX.Element => (
  <div className={`overflow-hidden bg-surface-200 dark:bg-surface-700 rounded-full ${sizeClass}`} role="status">
    <div className={`h-full w-full bg-current origin-left animate-[pulse_1.5s_ease-in-out_infinite] ${colorClass}`} />
  </div>
);

const renderPulse = (sizeClass: string, colorClass: string): JSX.Element => (
  <div className={`rounded-full bg-current animate-ping opacity-75 ${sizeClass} ${colorClass}`} role="status" />
);

const variantStrategyMap: Record<LoaderVariant, (sizeClass: string, colorClass: string) => JSX.Element> = {
  spinner: renderSpinner,
  dots: renderDots,
  bar: renderBar,
  pulse: renderPulse,
};

export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  className = '',
  overrideClassName,
  ...props
}) => {
  if (overrideClassName !== undefined) {
    return (
      <div className={overrideClassName} {...props}>
        {variantStrategyMap[variant](sizeStyles[variant][size], colorStyles[color])}
      </div>
    );
  }

  const combinedWrapperClass = `inline-flex items-center justify-center ${className}`.trim();

  return (
    <div className={combinedWrapperClass} {...props}>
      {variantStrategyMap[variant](sizeStyles[variant][size], colorStyles[color])}
    </div>
  );
};

Loader.displayName = 'Loader';