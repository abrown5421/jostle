import React from 'react';
import { Box, Pagination, Text } from '@inithium/ui';
import { FriendSearchInput } from './friend-search-input';

interface FriendsListShellProps {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder?: string;
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  isEmpty: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export const FriendsListShell: React.FC<FriendsListShellProps> = ({
  query,
  onQueryChange,
  placeholder,
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  isEmpty,
  emptyMessage = 'No results found.',
  children,
}) => (
  <Box flex direction="col" className="gap-3 w-full h-full">
    <FriendSearchInput value={query} onChange={onQueryChange} placeholder={placeholder} />

    {isEmpty ? (
      <Box flex direction="col" align="center" className="py-10 gap-2">
        <Text variant="body2" color="surface4-contrast" overrideClassName="text-sm opacity-60 text-center">
          {emptyMessage}
        </Text>
      </Box>
    ) : (
      <Box flex direction="col" className="gap-0.5 flex-1">
        {children}
      </Box>
    )}

    <Box flex direction="row" justify="center" className="pt-2">
      <Pagination
        totalItems={totalItems}
        itemsPerPage={pageSize}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </Box>
  </Box>
);