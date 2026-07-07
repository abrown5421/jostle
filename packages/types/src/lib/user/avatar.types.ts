import type { MouseEvent, ReactNode } from "react";

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'away';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  shape?: AvatarShape;
  background?: string;
  fontColor?: string; 
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
}

export interface AvatarFallbackProps {
  children?: ReactNode;
  className?: string;
}

export interface AvatarImageProps {
  src?: string;
  alt?: string;
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
  className?: string;
}