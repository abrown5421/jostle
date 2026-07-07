import React, { useMemo, useState } from 'react';
import { Box, Button, Pagination, Switch } from '@inithium/ui';
import {
  useReadAllPagesQuery,
  useDeletePageMutation,
  useDeletePagesBatchMutation,
  useDeletePageFileMutation,
} from '@inithium/store';
import { Page } from '@inithium/types';
import { PageItem } from './page-item';
import { PageFormDialog } from './page-form-dialog';
import { toSlug } from './page-form';
import { CmsDataPage } from '@inithium/ui';
import { ConfirmDeleteDialog } from '@inithium/ui';

const PAGE_SIZE = 8;

const filterPages =
  (query: string, showSystem: boolean) =>
  (pages: readonly Page[]): readonly Page[] => {
    const q = query.trim().toLowerCase();
    const nonCmsPages = pages.filter((p) => !p.componentKey?.startsWith('Cms'));
    const targeted = showSystem
      ? nonCmsPages
      : nonCmsPages.filter((p) => !p.is_system_page);
    if (!q) return targeted;
    return targeted.filter(
      (p) =>
        p.key?.toLowerCase().includes(q) ||
        p.path?.toLowerCase().includes(q) ||
        p.componentKey?.toLowerCase().includes(q),
    );
  };

const toggleSelection =
  (id: string) =>
  (selected: ReadonlySet<string>): ReadonlySet<string> => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

const toggleAll =
  (pageIds: readonly string[]) =>
  (selected: ReadonlySet<string>): ReadonlySet<string> => {
    const hasAll = pageIds.every((id) => selected.has(id));
    const next = new Set(selected);
    pageIds.forEach((id) => (hasAll ? next.delete(id) : next.add(id)));
    return next;
  };

const CmsPagesPage: React.FC = () => {
  const { data, isLoading, error } = useReadAllPagesQuery();
  const [deletePage] = useDeletePageMutation();
  const [deletePagesBatch] = useDeletePagesBatchMutation();
  const [deletePageFile] = useDeletePageFileMutation();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSystemPages, setShowSystemPages] = useState(true);
  const [editTarget, setEditTarget] = useState<Page | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{
    targets: readonly string[];
    label: string;
  } | null>(null);

  const pages: readonly Page[] = useMemo(() => data ?? [], [data]);
  const filteredPages = useMemo(
    () => filterPages(searchQuery, showSystemPages)(pages),
    [searchQuery, showSystemPages, pages],
  );

  const pagedPages = useMemo(
    () => filteredPages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredPages],
  );

  const pageIds = useMemo(() => pagedPages.map((p) => p._id), [pagedPages]);

  const isAllSelected = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [pageIds, selectedIds],
  );

  const deletableSelectedIds = useMemo(
    () =>
      Array.from(selectedIds).filter((id) => {
        const page = pages.find((p) => p._id === id);
        return page && !page.is_system_page;
      }),
    [selectedIds, pages],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleToggle = (id: string): void => setSelectedIds(toggleSelection(id));
  const handleToggleAll = (): void => setSelectedIds(toggleAll(pageIds));

  const handleCreateTrigger = (): void => {
    setEditTarget(undefined);
    setIsFormOpen(true);
  };

  const handleEditTrigger = (page: Page): void => {
    setEditTarget(page);
    setIsFormOpen(true);
  };

  const handleFormClose = (): void => {
    setIsFormOpen(false);
    setEditTarget(undefined);
  };

  const handleDeleteTrigger = (page: Page): void => {
    setDeleteContext({
      targets: [page._id],
      label: `Are you sure you want to permanently remove the "${page.key}" page? This action cannot be undone.`,
    });
  };

  const handleBulkDeleteTrigger = (): void => {
    const total = deletableSelectedIds.length;
    setDeleteContext({
      targets: deletableSelectedIds,
      label: `Are you sure you want to permanently remove ${total} selected page${total !== 1 ? 's' : ''}? System pages are excluded from deletion.`,
    });
  };

  const executeDeletion = async (closeDialog: () => void): Promise<void> => {
    if (!deleteContext) return;
    try {
      const { targets } = deleteContext;
      if (targets.length === 1) {
        const targetPage = pages.find((p) => p._id === targets[0]);
        await deletePage(targets[0]).unwrap();
        if (targetPage?.componentKey) {
          await deletePageFile(toSlug(targetPage.componentKey)).unwrap();
        }
        if (selectedIds.has(targets[0])) {
          setSelectedIds(toggleSelection(targets[0]));
        }
      } else {
        await deletePagesBatch(targets).unwrap();
        await Promise.all(
          targets.map((id) => {
            const targetPage = pages.find((p) => p._id === id);
            return targetPage?.componentKey
              ? deletePageFile(toSlug(targetPage.componentKey)).unwrap()
              : Promise.resolve();
          }),
        );
        setSelectedIds(new Set());
      }
      closeDialog();
    } catch (err) {
      console.error('Page deletion error:', err);
    } finally {
      setDeleteContext(null);
    }
  };

  return (
    <>
      <CmsDataPage
        isLoading={isLoading}
        error={error}
        errorMessage="Error loading pages"
        searchQuery={searchQuery}
        searchLabel="Search by key, path, or component"
        onSearchChange={handleSearchChange}
        toolbarAction={
          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={handleCreateTrigger}
            leadingIcon="file-plus"
          >
            Add Page
          </Button>
        }
        isAllSelected={isAllSelected}
        onToggleAll={handleToggleAll}
        selectBarExtras={
          <Switch
            label="Show System Pages"
            checked={showSystemPages}
            onChange={(checked: boolean) => {
              setShowSystemPages(checked);
              setCurrentPage(1);
            }}
            color="primary"
            size="sm"
          />
        }
        selectedCount={deletableSelectedIds.length}
        onBulkDelete={handleBulkDeleteTrigger}
        pagination={
          <Pagination
            totalItems={filteredPages.length}
            itemsPerPage={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        }
      >
        {pagedPages.length > 0 ? (
          pagedPages.map((page: Page) => (
            <PageItem
              key={page._id}
              page={page}
              isSelected={selectedIds.has(page._id)}
              onToggle={handleToggle}
              onEdit={handleEditTrigger}
              onDelete={handleDeleteTrigger}
            />
          ))
        ) : (
          <Box flex justify="center" align="center" className="py-8">
            <span className="text-secondary text-sm">
              {searchQuery ? `No pages match "${searchQuery}"` : 'No pages found.'}
            </span>
          </Box>
        )}
      </CmsDataPage>

      <PageFormDialog open={isFormOpen} page={editTarget} onClose={handleFormClose} />

      <ConfirmDeleteDialog
        open={Boolean(deleteContext)}
        label={deleteContext?.label ?? ''}
        onClose={() => setDeleteContext(null)}
        onConfirm={executeDeletion}
      />
    </>
  );
};

export default CmsPagesPage;
