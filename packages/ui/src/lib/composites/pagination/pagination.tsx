import React from 'react';
import { PaginationProps } from './pagination.types';
import { Button, Box, Text } from '../../components';
import { buildPageWindow, getTotalPages } from './pagination.utils';
import { PaginationItem } from './pagination-item';

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  visiblePages = 7,
  showEdgeButtons = false,
  prevLabel,
  nextLabel,
  className,
}) => {
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  if (totalPages <= 1) return null;

  const isFirst = currentPage <= 1;
  const isLast  = currentPage >= totalPages;

  const pageWindow = buildPageWindow(totalPages, currentPage, visiblePages);

  const navButtonClass = [
    'inline-flex items-center gap-1.5 px-3 h-9',
    'text-sm font-medium rounded-md border-2',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:pointer-events-none',
    'bg-surface text-surface-contrast border-surface-contrast',
    'hover:bg-surface2 hover:border-surface2-contrast',
  ].join(' ');

  return (
    <nav
      aria-label="Pagination"
      className={['flex items-center gap-1', className].filter(Boolean).join(' ')}
    >
      {showEdgeButtons && (
        <Button
          variant="outline"
          color="surface"
          size="sm"
          rounded
          disabled={isFirst}
          onClick={() => onPageChange(1)}
          aria-label="Go to first page"
          leadingIcon="chevrons-left"
          overrideClassName={navButtonClass}
        />
      )}

      <Button
        variant="outline"
        color="surface"
        size="sm"
        rounded
        disabled={isFirst}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
        leadingIcon={prevLabel ? undefined : 'chevron-left'}
        overrideClassName={navButtonClass}
      >
        {prevLabel && (
          <Text variant="body2" color="primary">
            {prevLabel}
          </Text>
        )}
      </Button>

      <Box flex direction="row" align="center" className="gap-1">
        {pageWindow.map((slot, idx) =>
          slot === '...' ? (
            <PaginationItem key={`ellipsis-${idx}`} page={undefined}>
              {slot}
            </PaginationItem>
          ) : (
            <PaginationItem
              key={slot}
              page={slot}
              isActive={slot === currentPage}
              onClick={() => onPageChange(slot)}
            >
              {slot}
            </PaginationItem>
          ),
        )}
      </Box>

      <Button
        variant="outline"
        color="surface"
        size="sm"
        rounded
        disabled={isLast}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next page"
        trailingIcon={nextLabel ? undefined : 'chevron-right'}
        overrideClassName={navButtonClass}
      >
        {nextLabel && (
          <Text variant="body2" color="primary">
            {nextLabel}
          </Text>
        )}
      </Button>

      {showEdgeButtons && (
        <Button
          variant="outline"
          color="surface"
          size="sm"
          rounded
          disabled={isLast}
          onClick={() => onPageChange(totalPages)}
          aria-label="Go to last page"
          trailingIcon="chevrons-right"
          overrideClassName={navButtonClass}
        />
      )}
    </nav>
  );
};