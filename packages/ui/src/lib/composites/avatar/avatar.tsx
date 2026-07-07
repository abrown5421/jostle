import React from 'react';
import { AvatarProps } from '@inithium/types';
import { AvatarContext } from './avatar-context';

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-lg',
  xl: 'w-48 h-48 text-3xl'
};

const shapeMap = {
  circle: 'rounded-full',
  square: 'rounded-xl'
};

const statusColorMap = {
  online: 'bg-[var(--color-success)] border-[var(--color-surface)]',
  offline: 'bg-[var(--color-surface4)] border-[var(--color-surface)]',
  away: 'bg-[var(--color-warning)] border-[var(--color-surface)]',
};

const statusSizeMap = {
  sm: 'w-2 h-2 bottom-0 right-0 border',
  md: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
  lg: 'w-4.5 h-4.5 bottom-0.5 right-0.5 border-2',
  xl: 'w-6 h-6 bottom-1 right-1 border-2'
};

const tooltipPositionMap = {
  sm: 'bottom-3 left-1/2',
  md: 'bottom-4 left-1/2',
  lg: 'bottom-5 left-1/2',
  xl: 'bottom-7 left-1/2'
};

const tooltipBaseClasses = [
  'absolute',
  '-translate-x-1/2',
  'scale-0',
  'group-hover:scale-100',
  'transition-all',
  'duration-150',
  'bg-black',
  'text-white',
  'text-[10px]',
  'px-1.5',
  'py-0.5',
  'rounded',
  'pointer-events-none',
  'z-10',
  'capitalize'
].join(' ');

export const Avatar: React.FC<AvatarProps & { children?: React.ReactNode }> = ({
  fontColor,
  background,
  size = 'md',
  status,
  shape = 'circle',
  onClick,
  className = '',
  children
}) => {
  const [hasImageLoaded, setHasImageLoaded] = React.useState(false);

  const containerClasses = [
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'select-none',
    'font-semibold',
    'transition-all',
    'duration-300',
    'ease-out',
    sizeMap[size],
    shapeMap[shape],
    onClick ? 'cursor-pointer hover:scale-105' : '',
    className
  ].filter(Boolean).join(' ');

  const statusClasses = status ? [
    'absolute',
    'rounded-full',
    'group',
    statusColorMap[status],
    statusSizeMap[size]
  ].filter(Boolean).join(' ') : '';

  const tooltipClasses = status ? [
    tooltipBaseClasses,
    tooltipPositionMap[size]
  ].join(' ') : '';

  const inlineStyle: React.CSSProperties = {
    ...(background ? { background } : {}),
    ...(fontColor  ? { color: fontColor } : {}),
  };

  return (
    <AvatarContext.Provider value={{ size, shape, hasImageLoaded, setHasImageLoaded, hasBackground: !!background }}>
      <div
        className={containerClasses}
        style={inlineStyle}
        onClick={onClick}
      >
        {children}
        {status && (
          <span className={statusClasses} aria-hidden="true">
            <span className={tooltipClasses}>
              {status}
            </span>
          </span>
        )}
      </div>
    </AvatarContext.Provider>
  );
};