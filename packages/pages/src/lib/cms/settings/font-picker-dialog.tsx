import { Box, Dialog, Input, Pagination, Text } from '@inithium/ui';
import React, { useMemo, useState } from 'react';
import { useGetAssetsQuery } from '@inithium/store';
import type { Asset } from '@inithium/types';
import { getProxyUrl, PAGE_SIZE } from './utils';

interface FontPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl: string;
}

const FontPickerDialog: React.FC<FontPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  selectedUrl,
}) => {
  const { data: assets } = useGetAssetsQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const appFonts = useMemo<Asset[]>(
    () =>
      (assets ?? []).filter((a) => {
        const category = a.category as string;
        return a.owner_type === 'app' && (category === 'font' || category === 'fonts');
      }),
    [assets],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appFonts;
    return appFonts.filter(
      (a) =>
        a.original_name?.toLowerCase().includes(q) ||
        a.filename?.toLowerCase().includes(q) ||
        a.storage_key?.toLowerCase().includes(q),
    );
  }, [appFonts, search]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSelect = (asset: Asset) => {
    onSelect(getProxyUrl(asset));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Select Font"
      size="lg"
      variant="default"
      backdrop
      transition
      closeOnBackdropClick
      showCloseButton
    >
      <Box flex direction="col" className="gap-4">
        <Input
          label="Search fonts…"
          leadingIcon="search"
          variant="outline"
          color="primary"
          size="sm"
          fullWidth
          value={search}
          onChange={handleSearchChange}
        />

        {paged.length === 0 ? (
          <Box flex justify="center" align="center" className="py-12">
            <Text variant="body2" color="secondary">
              {search ? `No fonts match "${search}"` : 'No app fonts found.'}
            </Text>
          </Box>
        ) : (
          <Box flex direction="col" className="gap-2">
            {paged.map((asset) => {
              const url = getProxyUrl(asset);
              const isSelected = url === selectedUrl;
              const name = asset.original_name ?? asset.filename ?? asset.storage_key ?? 'Unnamed';
              const fontFaceId = `font-preview-${asset._id}`;

              return (
                <button
                  key={asset._id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  className={[
                    'flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left',
                    isSelected
                      ? 'border-primary ring-2 ring-primary bg-primary/5'
                      : 'border-surface4 hover:border-primary/50 bg-surface',
                  ].join(' ')}
                >
                  <style>{`
                    @font-face {
                      font-family: '${fontFaceId}';
                      src: url('${url}');
                    }
                  `}</style>

                  <Box flex direction="col" className="gap-1 min-w-0">
                    <Text
                      variant="caption"
                      overrideClassName="text-xs text-secondary truncate"
                    >
                      {name}
                    </Text>
                    <span
                      style={{ fontFamily: `'${fontFaceId}', serif`, fontSize: '1.25rem' }}
                      className="text-primary truncate"
                    >
                      The quick brown fox jumps over the lazy dog
                    </span>
                  </Box>

                  {isSelected && (
                    <div className="ml-3 shrink-0 bg-primary text-primary-contrast rounded-full p-0.5">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </Box>
        )}

        <Box flex justify="center" align="center" className="pt-2">
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
          />
        </Box>
      </Box>
    </Dialog>
  );
};

export default FontPickerDialog;