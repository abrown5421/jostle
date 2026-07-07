import React from 'react';
import { Page } from '@inithium/types';
import { Box, Button, Text } from '@inithium/ui';
import { CmsItemRow } from '@inithium/ui';

const STATUS_STYLES = {
  active: 'bg-success text-success-contrast',
  inactive: 'bg-surface3 text-secondary',
};

export interface PageItemProps {
  page: Page;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (page: Page) => void;
  onDelete: (page: Page) => void;
}

export const PageItem: React.FC<PageItemProps> = ({
  page,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const statusStyle = page.isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive;

  return (
    <CmsItemRow
      isSelected={isSelected}
      onToggle={() => onToggle(page._id)}
      checkboxDisabled={page.is_system_page}
      infoSlot={
        <>
          <Box flex align="center" className="gap-1.5">
            <Text variant="body2" overrideClassName="font-semibold text-sm text-primary truncate">
              {page.key}
            </Text>
            {page.is_system_page && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-warning/10 text-warning uppercase tracking-wide shrink-0">
                system
              </span>
            )}
          </Box>
          <Text
            variant="caption"
            color="secondary"
            overrideClassName="text-xs text-secondary truncate"
          >
            {page.path}
          </Text>
        </>
      }
      badgesSlot={
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${statusStyle}`}
        >
          {page.isActive ? 'active' : 'inactive'}
        </span>
      }
      actionsSlot={
        <>
          <Button
            variant="ghost"
            color="secondary"
            size="sm"
            rounded
            icon="pencil"
            onClick={() => onEdit(page)}
            aria-label={`Edit ${page.key}`}
          />
          <Button
            variant="ghost"
            color="danger"
            size="sm"
            rounded
            icon="trash-2"
            onClick={() => onDelete(page)}
            disabled={page.is_system_page}
            aria-label={`Delete ${page.key}`}
          />
        </>
      }
    />
  );
};
