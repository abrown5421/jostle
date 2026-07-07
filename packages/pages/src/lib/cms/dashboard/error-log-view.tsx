import React, { useState } from 'react';
import { Box, Button, Text, Loader, Pagination, Dialog, ConfirmDeleteDialog } from '@inithium/ui';
import { useSystemErrorsPageQuery, useDeleteSystemErrorMutation } from '@inithium/store'; 

interface ApiErrorRecord {
  _id: string;
  message: string;
  statusCode: number;
  method: string;
  url: string;
  stack?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const SEVERITY_OPTIONS = [
  { label: 'All Logs', value: 'all' },
  { label: 'Medium', value: 'medium' },
  { label: 'Critical', value: 'critical' },
] as const;

export const ErrorLogView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [severityFilter, setSeverityFilter] = useState<typeof SEVERITY_OPTIONS[number]['value']>('all');
  const [selectedError, setSelectedError] = useState<ApiErrorRecord | null>(null);
  
  const [deleteContext, setDeleteContext] = useState<{
    targetId: string;
    label: string;
  } | null>(null);

  const [deleteError] = useDeleteSystemErrorMutation();

  const { data, isLoading, isError } = useSystemErrorsPageQuery({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    severity: severityFilter === 'all' ? undefined : severityFilter
  });

  if (isLoading) {
    return (
      <div className="w-full h-96 flex justify-center items-center">
        <Loader variant="spinner" size="lg" color="primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Box color="surface3-contrast" padding="lg" align="center" className="rounded-xl w-full bg-surface3">
        <Text color="danger" decoration={{ bold: true }}>
          Failed to fetch API log records from server collection.
        </Text>
      </Box>
    );
  }

  const errorRecords = data.data ?? [];
  const totalCount = data.meta?.total ?? errorRecords.length;

  const handleDeleteTrigger = (error: ApiErrorRecord): void => {
    setDeleteContext({
      targetId: error._id,
      label: `Are you sure you want to permanently remove this error log entry? This action cannot be undone.`
    });
  };

  const executeDeletion = async (closeDialog: () => void): Promise<void> => {
    if (!deleteContext) return;
    try {
      await deleteError(deleteContext.targetId).unwrap();
      closeDialog();
    } catch (err) {
      console.error('Destructive pipeline error during error log removal:', err);
    } finally {
      setDeleteContext(null);
    }
  };

  return (
    <>
      <Box color="surface3-contrast" flex direction="col" padding="md" className="rounded-xl w-full">
        <Box flex direction="row" align="center" justify="between" className="w-full mb-2">
          <Box flex direction="col">
            <Text variant="h6" color="surface" decoration={{ bold: true }}>
              API System Logs
            </Text>
          </Box>

          <Box flex direction="row" className="gap-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => {
                  setSeverityFilter(opt.value);
                  setCurrentPage(1);
                }}
                color={severityFilter === opt.value ? 'primary' : 'surface'}
                variant={severityFilter === opt.value ? 'solid' : 'ghost'}
                size="sm"
                rounded
              >
                {opt.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box flex direction="col" className="w-full gap-2">
          {errorRecords.length === 0 ? (
            <Box flex direction="col" align="center" padding="lg">
              <Text variant="body2" color="surface2-contrast" overrideClassName="opacity-70">
                No logged errors matching the current filters.
              </Text>
            </Box>
          ) : (
            errorRecords.map((error: ApiErrorRecord) => {
              const isCritical = error.statusCode >= 500;
              return (
                <Box
                  key={error._id}
                  flex
                  direction="row"
                  align="center"
                  justify="between"
                  padding="md"
                  onClick={() => setSelectedError(error)}
                  className={`bg-surface hover:bg-surface2 rounded-xl cursor-pointer transition-all duration-150 border-l-4 ${isCritical ? 'border-danger' : 'border-warning'}`}
                >
                  <Box flex direction="row" align="center" className="gap-4 max-w-3xl">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      isCritical ? 'text-danger' : 'text-warning'
                    }`}>
                      {error.statusCode}
                    </span>
                    
                    <Box flex direction="col">
                      <Text decoration={{ bold: true }} overrideClassName="truncate max-w-xl text-surface-contrast">
                        {error.message}
                      </Text>
                      <Text variant="body2" overrideClassName="opacity-50 font-mono text-xs text-surface3-contrast">
                        {error.method} — {error.url}
                      </Text>
                    </Box>
                  </Box>

                  <Text variant="body2" overrideClassName="opacity-40 font-mono text-xs text-surface3-contrast">
                    {error.createdAt ? new Date(error.createdAt).toLocaleTimeString() : '--:--'}
                  </Text>
                  <Button
                    variant="ghost"
                    color="danger"
                    size="sm"
                    rounded
                    icon="trash-2"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteTrigger(error);
                    }}
                  />
                </Box>
              );
            })
          )}
        </Box>

        <Box flex justify="center" className="mt-6">
          <Pagination
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            showEdgeButtons
          />
        </Box>

        <Dialog
          open={Boolean(selectedError)}
          onClose={() => setSelectedError(null)}
          title={selectedError ? `Log Inspector: [${selectedError.statusCode}] ${selectedError.method} ${selectedError.url}` : ''}
          size="xl"
          actions={[{ label: 'Close Panel', onClick: (close) => close(), variant: 'outline' }]}
        >
          {selectedError && (
            <Box flex direction="col" className="gap-4 font-mono text-sm w-full">
              <Box className="bg-surface p-3 rounded-lg border border-surface-contrast/10">
                <Text variant="body2" decoration={{ bold: true }} color="primary" overrideClassName="mb-1">
                  Message String:
                </Text>
                <div className="text-surface-contrast break-words">{selectedError.message}</div>
              </Box>
              {selectedError.details && (
                <Box className="bg-surface p-3 rounded-lg border border-surface-contrast/10">
                  <Text variant="body2" decoration={{ bold: true }} color="warning" overrideClassName="mb-1">
                    Validation Metadata Details:
                  </Text>
                  <pre className="overflow-x-auto text-xs bg-black/20 p-2 rounded max-h-48 text-warning-contrast">
                    {JSON.stringify(selectedError.details, null, 2)}
                  </pre>
                </Box>
              )}
              {selectedError.stack && (
                <Box className="bg-surface p-3 rounded-lg border border-surface-contrast overflow-hidden min-w-0">
                  <Text variant="body2" decoration={{ bold: true }} color="danger" overrideClassName="mb-1">
                    Runtime Stack trace execution tree output:
                  </Text>
                  <pre className="overflow-auto text-xs p-2 rounded text-danger max-h-64 whitespace-pre leading-relaxed">
                    {selectedError.stack}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </Dialog>
      </Box>

      <ConfirmDeleteDialog
        open={Boolean(deleteContext)}
        label={deleteContext?.label ?? ''}
        onClose={() => setDeleteContext(null)}
        onConfirm={executeDeletion}
      />
    </>
  );
};

export default ErrorLogView;