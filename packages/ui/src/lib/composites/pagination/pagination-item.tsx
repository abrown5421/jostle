import React from 'react';
import { Button, Text } from '../../components';
import { PaginationItemProps } from './pagination.types';

export const PaginationItem: React.FC<PaginationItemProps> = ({
  page,
  isActive = false,
  disabled = false,
  onClick,
  ariaLabel,
  children,
}) => {
  if (page === undefined) {
    return (
      <span
        className="inline-flex items-end justify-center w-9 h-9 pb-1 select-none"
        aria-hidden="true"
      >
        <Text variant="body2" color="secondary">
          &hellip;
        </Text>
      </span>
    );
  }

  return (
    <Button
      variant={isActive ? 'solid' : 'outline'}
      color={isActive ? 'primary' : 'surface'}
      size="sm"
      rounded
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? `Go to page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      overrideClassName={[
        'w-9 h-9 p-0 text-sm font-medium rounded-md',
        'inline-flex items-center justify-center',
        'border-2 transition-all duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        isActive
          ? 'bg-primary text-primary-contrast border-primary'
          : 'bg-surface text-surface-contrast border-surface-contrast hover:bg-surface2 hover:border-surface2-contrast',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Button>
  );
};