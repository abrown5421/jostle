import React from 'react';
import { Box } from '../../components/box';
import { Button } from '../../components/button';
import { Checkbox } from '../../components/checkbox';
import { Input } from '../../components/input';
import { Loader } from '../../components/loader';
import { Text } from '../../components/text';

export interface CmsDataPageProps {
  isLoading: boolean;
  noSelectAll?: boolean;
  error: unknown;
  errorMessage?: string;
  searchQuery: string;
  searchLabel: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toolbarAction?: React.ReactNode;
  isAllSelected: boolean;
  onToggleAll: () => void;
  totalFilteredCount?: number;
  selectBarExtras?: React.ReactNode;
  selectedCount: number;
  canBulkDelete?: boolean;
  onBulkDelete?: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  pagination?: React.ReactNode;
  sidebarSlot?: React.ReactNode;
}

export const CmsDataPage: React.FC<CmsDataPageProps> = ({
  isLoading,
  error,
  noSelectAll,
  errorMessage = 'Error loading resources',
  searchQuery,
  searchLabel,
  onSearchChange,
  toolbarAction,
  isAllSelected,
  onToggleAll,
  totalFilteredCount,
  selectBarExtras,
  selectedCount,
  canBulkDelete = true,
  onBulkDelete,
  children,
  pagination,
  sidebarSlot,
}) => {
  if (isLoading) {
    return (
      <Box flex justify="center" align="center" className="h-full w-full">
        <Loader variant="spinner" size="lg" color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex justify="center" align="center" className="h-full w-full">
        <Text color="danger">{errorMessage}</Text>
      </Box>
    );
  }

  const inner = (
    <Box flex direction="col" className="h-full gap-2">
      <Box flex justify="between" align="center" className="w-full gap-2 shrink-0">
        <Box className="flex-1">
          <Input
            label={searchLabel}
            leadingIcon="search"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={searchQuery}
            onChange={onSearchChange}
          />
        </Box>
        {toolbarAction}
      </Box>

      <Box
        flex
        align="center"
        justify="between"
        className="bg-surface1 px-3 py-2 rounded-md shrink-0"
      >
        {!noSelectAll && (
          <Box flex align="center" className="gap-2">
            <Checkbox
              checked={isAllSelected}
              onChange={onToggleAll}
              color="primary"
              size="sm"
            />
            <Text variant="body2" overrideClassName="font-medium text-sm">
              Select All on Page
            </Text>
            {totalFilteredCount !== undefined && totalFilteredCount > 0 && (
              <Text variant="caption" color="secondary" overrideClassName="text-xs">
                ({totalFilteredCount} total)
              </Text>
            )}
          </Box>
        )}

        <Box flex align="center" className="gap-4">
          {selectBarExtras}
          {selectedCount > 0 && canBulkDelete && onBulkDelete && (
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              onClick={onBulkDelete}
              leadingIcon="trash-2"
            >
              Delete Selected ({selectedCount})
            </Button>
          )}
        </Box>
      </Box>

      <Box flex direction="col" className="flex-1 gap-2 overflow-y-auto min-h-0">
        {children}
      </Box>

      {pagination && (
        <Box flex justify="center" align="center" className="shrink-0 py-2">
          {pagination}
        </Box>
      )}
    </Box>
  );

  if (sidebarSlot) {
    return (
      <Box flex direction="row" className="h-full w-full overflow-hidden">
        {sidebarSlot}
        <Box flex direction="col" className="flex-1 min-w-0 h-full overflow-hidden p-4">
          {inner}
        </Box>
      </Box>
    );
  }

  return (
    <Box padding="md" className="h-full w-full">
      {inner}
    </Box>
  );
};