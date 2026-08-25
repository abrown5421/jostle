import { Button, cn, Container, Input, Text } from '@jostle/ui';
import { useEffect, useMemo, useState } from 'react';
import type { AggregatedPlaylistOption } from '../client/index.js';

export interface PlaylistPickerGridProps {
  readonly options: ReadonlyArray<AggregatedPlaylistOption>;
  readonly selectedPlaylistId?: string;
  readonly onSelect: (playlistId: string) => void;
}

const PAGE_SIZE = 9;

export function PlaylistPickerGrid({ options, selectedPlaylistId, onSelect }: PlaylistPickerGridProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <Container direction="col" gap={3} className="w-full">
      <Input label="Search playlists" value={query} setValue={setQuery} color="primary" />

      {pageItems.length === 0 ? (
        <Text textColor="content-secondary">No playlists match your search.</Text>
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {pageItems.map((option) => (
            <button
              key={option.playlistId}
              type="button"
              onClick={() => onSelect(option.playlistId)}
              className={cn(
                'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer',
                option.playlistId === selectedPlaylistId
                  ? 'border-primary bg-surface-tertiary'
                  : 'border-surface-tertiary bg-surface-secondary hover:bg-surface-tertiary',
              )}
            >
              {option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={option.name}
                  className="aspect-square w-full rounded object-cover"
                />
              )}
              <Text fontWeight="semibold" textColor="content-primary">
                {option.name}
              </Text>
              <Text fontSize="sm" textColor="content-secondary">
                {option.trackCount} tracks &middot; {option.contributedByDisplayName}
              </Text>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Container direction="row" horizontalAlign="center" gap={3} verticalAlign="center">
          <Button
            variant="outlined"
            disabled={currentPage === 0}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
          >
            Previous
          </Button>
          <Text textColor="content-secondary">
            Page {currentPage + 1} of {totalPages}
          </Text>
          <Button
            variant="outlined"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
          >
            Next
          </Button>
        </Container>
      )}
    </Container>
  );
}
