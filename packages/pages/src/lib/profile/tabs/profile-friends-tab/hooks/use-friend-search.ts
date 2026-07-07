import { useMemo, useState } from 'react';

export const useFriendSearch = <T>(
  items: readonly T[],
  predicate: (item: T, query: string) => boolean,
  pageSize = 8,
) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => predicate(i, q)) : items;
  }, [items, query, predicate]);

  const totalItems = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return { query, setQuery: handleQuery, page, setPage, paginated, totalItems, pageSize };
};