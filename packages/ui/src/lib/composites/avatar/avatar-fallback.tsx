import React from 'react';
import { AvatarFallbackProps } from '@inithium/types';
import { useAvatarContext } from './avatar-context';

const shapeMap = {
  circle: 'rounded-full',
  square: 'rounded-xl'
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  children,
  className = ''
}) => {
  const { hasImageLoaded, shape, hasBackground } = useAvatarContext();

  if (hasImageLoaded) return null;

  const fallbackClasses = [
    'w-full',
    'h-full',
    'flex',
    'items-center',
    'justify-center',
    'uppercase',
    'tracking-wider',
    !hasBackground && 'bg-gradient-to-br',
    !hasBackground && 'from-[var(--color-surface3)]',
    !hasBackground && 'to-[var(--color-surface4)]',
    shapeMap[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={fallbackClasses}>
      {children}
    </div>
  );
};