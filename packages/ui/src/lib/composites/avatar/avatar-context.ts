import React from 'react';

export interface AvatarContextProps {
  size: 'sm' | 'md' | 'lg' | 'xl';
  shape: 'circle' | 'square';
  hasImageLoaded: boolean;
  setHasImageLoaded: (loaded: boolean) => void;
  hasBackground: boolean;
}

export const AvatarContext = React.createContext<AvatarContextProps | undefined>(undefined);

export const useAvatarContext = (): AvatarContextProps => {
  const context = React.useContext(AvatarContext);
  if (!context) {
    throw new Error('Avatar compound components must be rendered within the Avatar component');
  }
  return context;
};