import React, { useEffect, useMemo } from 'react';
import { AnimationController, AlertPosition } from '@inithium/types';
import { ManagedAlertProps } from './alert.types';
import { Box } from '../box/box';
import { Button } from '../button/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../composites';

const positionStyles: Record<AlertPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

const renderAvatar = (avatarProps?: ManagedAlertProps['alertData']['avatar']) => {
  if (!avatarProps) return null;
  
  return (
    <Avatar {...avatarProps} className={`mr-3 flex-shrink-0 ${avatarProps.className ?? ''}`}>
      <AvatarImage src={avatarProps.src} alt={avatarProps.alt} />
      <AvatarFallback>{avatarProps.fallback ?? avatarProps.alt?.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
};

export const Alert: React.FC<ManagedAlertProps> = ({ alertData, onDismiss, onExited }) => {
  const controller: AnimationController = useMemo(() => ({
    phase: 'idle',
    triggerEnter: () => {},
    triggerExit: () => Promise.resolve(),
  }), []);

  const mergedAnimation = useMemo(() => ({
    ...alertData.animation_object,
    controller,
  }), [alertData.animation_object, controller]);

  useEffect(() => {
    if (!alertData.open) {
      const fallback = setTimeout(onExited, 400);
      controller.triggerExit().then(() => {
        clearTimeout(fallback);
        onExited();
      });
      return () => clearTimeout(fallback);
    }
  }, [alertData.open, controller, onExited]);

  useEffect(() => {
    if (!alertData.open) return;

    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [alertData.open, onDismiss]);

  return (
    <div 
      className={`fixed z-50 w-full max-w-md transition-all duration-300 ${
        alertData.open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      } ${positionStyles[alertData.position ?? 'bottom-right']}`}
    >
      <Box
        color={alertData.severity}
        animation={mergedAnimation}
        flex
        align="center"
        justify="between"
        padding="md"
        borderRadius="md"
        border
        fullWidth
      >
        <div className="flex items-center min-w-0 flex-1">
          {renderAvatar(alertData.avatar)}
          <span className="truncate">{alertData.message}</span>
        </div>
        
        {alertData.closeable && (
          <Button
            color={alertData.severity}
            variant="ghost"
            size="sm"
            icon="x"
            onClick={onDismiss}
            className="ml-4 flex-shrink-0"
          />
        )}
      </Box>
    </div>
  );
};