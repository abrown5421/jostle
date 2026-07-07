export function buildPageWindow(
  totalPages: number,
  currentPage: number,
  visiblePages: number,
): (number | '...')[] {
  if (totalPages <= visiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const sideCount = Math.floor((visiblePages - 3) / 2);

  const showLeftEllipsis  = currentPage - sideCount > 2;
  const showRightEllipsis = currentPage + sideCount < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = visiblePages - 2; 
    return [
      ...Array.from({ length: leftCount }, (_, i) => i + 1),
      '...',
      totalPages,
    ];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = visiblePages - 2;
    return [
      1,
      '...',
      ...Array.from({ length: rightCount }, (_, i) => totalPages - rightCount + i + 1),
    ];
  }

  const middlePages: number[] = [];
  for (let p = currentPage - sideCount; p <= currentPage + sideCount; p++) {
    middlePages.push(p);
  }

  return [1, '...', ...middlePages, '...', totalPages];
}

export function getTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.max(1, Math.ceil(totalItems / itemsPerPage));
}