import React from 'react';
import { AvatarImageProps } from '@inithium/types';
import { useAvatarContext } from './avatar-context';

const shapeMap = {
  circle: 'rounded-full',
  square: 'rounded-xl'
};

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt = 'User Avatar',
  onLoadingStatusChange,
  className = ''
}) => {
  const { shape, setHasImageLoaded } = useAvatarContext();

  const handleLoad = React.useCallback(() => {
    setHasImageLoaded(true);
    onLoadingStatusChange?.('loaded');
  }, [setHasImageLoaded, onLoadingStatusChange]);

  const handleError = React.useCallback(() => {
    setHasImageLoaded(false);
    onLoadingStatusChange?.('error');
  }, [setHasImageLoaded, onLoadingStatusChange]);

  React.useEffect(() => {
    onLoadingStatusChange?.('loading');
  }, [src, onLoadingStatusChange]);

  if (!src) return null;

  const imageClasses = [
    'w-full',
    'h-full',
    'object-cover',
    'transition-opacity',
    'duration-300',
    shapeMap[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={imageClasses}
    />
  );
};