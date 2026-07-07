import { Box } from '../../components/box';
import { Dialog } from '../../components/dialog';
import { Input } from '../../components/input';
import { Pagination } from '../pagination';
import { Text } from '../../components/text';
import React, { useMemo, useState } from 'react';

const PAGE_SIZE = 12;

export interface AssetPickerItem {
  id: string;
  url: string;
  name: string;
  thumbnailUrl?: string;
}

interface AssetPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl: string;
  assets: AssetPickerItem[];
  title?: string;
  pageSize?: number;
}

const AssetPickerDialog: React.FC<AssetPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  selectedUrl,
  assets,
  title = 'Select Image',
  pageSize = PAGE_SIZE,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => a.name.toLowerCase().includes(q));
  }, [assets, search]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSelect = (asset: AssetPickerItem) => {
    onSelect(asset.url);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="full"
      variant="default"
      backdrop
      transition
      closeOnBackdropClick
      showCloseButton
    >
      <Box flex direction="col" className="gap-4">
        <Input
          label="Search images…"
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
              {search ? `No images match "${search}"` : 'No images found.'}
            </Text>
          </Box>
        ) : (
          <div className="flex justify-center w-full">
            <div className="flex flex-wrap gap-4 justify-start">
              {paged.map((asset) => {
                const isSelected = asset.url === selectedUrl;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelect(asset)}
                    style={{ width: '200px' }}
                    className={[
                      'group relative flex flex-col rounded-lg overflow-hidden border-2 transition-all duration-150 text-left shrink-0',
                      isSelected
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-surface4 hover:border-primary/50',
                    ].join(' ')}
                  >
                    <div
                      style={{ height: '200px' }}
                      className="w-full bg-surface2 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={asset.thumbnailUrl ?? asset.url}
                        alt={asset.name}
                        style={{ width: '200px', height: 'auto' }}
                        className="object-contain"
                      />
                    </div>
                    <div className="w-full px-2 py-1 bg-surface shrink-0 border-t border-surface4">
                      <Text
                        variant="caption"
                        overrideClassName="text-[10px] leading-tight truncate block text-surface-contrast"
                      >
                        {asset.name}
                      </Text>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-primary-contrast rounded-full p-0.5 z-10">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            </div>
          </div>
        )}

        <Box flex justify="center" align="center" className="pt-2">
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={pageSize}
            currentPage={page}
            onPageChange={setPage}
          />
        </Box>
      </Box>
    </Dialog>
  );
};

export default AssetPickerDialog;