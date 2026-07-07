import React, { useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@inithium/ui';
import {
  useGetAssetsQuery,
  useDeleteAssetMutation,
  useCreateAssetIntentMutation,
  useUploadAssetBinaryMutation,
  showAlert,
} from '@inithium/store';
import type { Asset } from '@inithium/types';
import { AssetBrowserSidebar } from './asset-browser-sidebar';
import { AssetGrid } from './asset-grid';
import { AssetUploadDialog } from './asset-upload-dialog';
import { CmsDataPage } from '@inithium/ui';
import { ConfirmDeleteDialog } from '@inithium/ui';

export type AssetCategory = 'all' | 'images' | 'fonts' | 'audio' | 'videos' | 'documents' | 'misc';
export type AssetOwnerContext = 'all' | 'app' | 'user';

const PAGE_SIZE = 8;

const singularCategory = (cat: AssetCategory): string => {
  const map: Record<string, string> = {
    images: 'image',
    fonts: 'font',
    audio: 'audio',
    videos: 'video',
    documents: 'document',
    misc: 'other',
  };
  return map[cat] ?? cat;
};

const filterAssets = (
  assets: readonly Asset[],
  query: string,
  category: AssetCategory,
  ownerContext: AssetOwnerContext,
): readonly Asset[] => {
  let result = assets;

  if (category !== 'all') {
    result = result.filter(
      (a) => a.category === category || a.category === singularCategory(category),
    );
  }

  if (ownerContext !== 'all') {
    result = result.filter((a) => a.owner_type === ownerContext);
  }

  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (a) =>
        a.original_name?.toLowerCase().includes(q) ||
        a.storage_key?.toLowerCase().includes(q) ||
        a.filename?.toLowerCase().includes(q),
    );
  }

  return result;
};

const CmsAssetsPage: React.FC = () => {
  const dispatch = useDispatch();

  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [selectedOwnerContext, setSelectedOwnerContext] = useState<AssetOwnerContext>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{
    targets: readonly string[];
    label: string;
  } | null>(null);

  const { data, isLoading, error } = useGetAssetsQuery();
  const [deleteAsset] = useDeleteAssetMutation();
  const [createAssetIntent] = useCreateAssetIntentMutation();
  const [uploadAssetBinary] = useUploadAssetBinaryMutation();

  const assets: readonly Asset[] = useMemo(() => data ?? [], [data]);

  const filteredAssets = useMemo(
    () => filterAssets(assets, searchQuery, selectedCategory, selectedOwnerContext),
    [assets, searchQuery, selectedCategory, selectedOwnerContext],
  );

  const pagedAssets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAssets.slice(start, start + PAGE_SIZE);
  }, [filteredAssets, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    const pageIds = pagedAssets.map((a) => a._id);
    setSelectedIds((prev) => {
      const hasAll = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      pageIds.forEach((id) => (hasAll ? next.delete(id) : next.add(id)));
      return next;
    });
  }, [pagedAssets]);

  const isAllSelected = useMemo(
    () =>
      pagedAssets.length > 0 && pagedAssets.every((a) => selectedIds.has(a._id)),
    [pagedAssets, selectedIds],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: AssetCategory): void => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleOwnerContextChange = (ctx: AssetOwnerContext): void => {
    setSelectedOwnerContext(ctx);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleDeleteTrigger = (asset: Asset): void => {
    setDeleteContext({
      targets: [asset._id],
      label: `Are you sure you want to permanently delete "${asset.original_name ?? asset.storage_key}"? This action cannot be undone.`,
    });
  };

  const handleBulkDeleteTrigger = (): void => {
    const total = selectedIds.size;
    setDeleteContext({
      targets: Array.from(selectedIds),
      label: `Are you sure you want to permanently delete ${total} selected asset${total !== 1 ? 's' : ''}? This action cannot be undone.`,
    });
  };

  const executeDeletion = async (closeDialog: () => void): Promise<void> => {
    if (!deleteContext) return;
    try {
      await Promise.all(deleteContext.targets.map((id) => deleteAsset(id).unwrap()));
      setSelectedIds(new Set());
      closeDialog();
      dispatch(
        showAlert({
          message: `${deleteContext.targets.length} asset${deleteContext.targets.length !== 1 ? 's' : ''} deleted.`,
          severity: 'success',
          closeable: false,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
        }),
      );
    } catch (err) {
      console.error('Asset deletion error:', err);
      dispatch(showAlert({ 
        message: 'Failed to delete one or more assets.', 
        severity: 'success',
          closeable: false,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
      }));
    } finally {
      setDeleteContext(null);
    }
  };

  const handleUploadComplete = (count: number): void => {
    setIsUploadOpen(false);
    dispatch(
      showAlert({
        message: `${count} asset${count !== 1 ? 's' : ''} uploaded successfully.`,
        severity: 'success',
          closeable: false,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
      }),
    );
  };

  return (
    <>
      <CmsDataPage
        isLoading={isLoading}
        error={error}
        errorMessage="Error loading assets"
        searchQuery={searchQuery}
        searchLabel="Search by name or key"
        onSearchChange={handleSearchChange}
        toolbarAction={
          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leadingIcon="upload"
          >
            Upload Assets
          </Button>
        }
        isAllSelected={isAllSelected}
        onToggleAll={handleToggleAll}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDeleteTrigger}
        sidebarSlot={
          <AssetBrowserSidebar
            selectedCategory={selectedCategory}
            selectedOwnerContext={selectedOwnerContext}
            assets={assets}
            onCategoryChange={handleCategoryChange}
            onOwnerContextChange={handleOwnerContextChange}
          />
        }
        pagination={
          totalPages > 1 ? (
            <div className="flex justify-center gap-2 py-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={[
                    'px-3 py-1 rounded text-sm',
                    p === currentPage
                      ? 'bg-primary text-primary-contrast font-semibold'
                      : 'bg-surface2 text-secondary hover:bg-surface3',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        <AssetGrid
          assets={pagedAssets}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onDelete={handleDeleteTrigger}
          searchQuery={searchQuery}
        />
      </CmsDataPage>

      <AssetUploadDialog
        open={isUploadOpen}
        defaultOwnerContext="app"
        onClose={() => setIsUploadOpen(false)}
        onComplete={handleUploadComplete}
        createAssetIntent={createAssetIntent}
        uploadAssetBinary={uploadAssetBinary}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteContext)}
        label={deleteContext?.label ?? ''}
        onClose={() => setDeleteContext(null)}
        onConfirm={executeDeletion}
      />
    </>
  );
};

export default CmsAssetsPage;
