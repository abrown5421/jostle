export interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  visiblePages?: number;
  showEdgeButtons?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

export interface PaginationItemProps {
  page: number | undefined;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}