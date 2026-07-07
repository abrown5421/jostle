import React from 'react';
import { Dialog } from '@inithium/ui';
import { Page } from '@inithium/types';
import { PageForm } from './page-form';

export interface PageFormDialogProps {
  open: boolean;
  page?: Page;
  onClose: () => void;
}

export const PageFormDialog: React.FC<PageFormDialogProps> = ({ open, page, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    title={page ? `Modify System Record: ${page.key}` : 'Create New System Architecture Page'}
    size="xl"
    variant="default"
    backdrop={true}
    transition={true}
    closeOnBackdropClick={!page?.is_system_page}
    showCloseButton={true}
  >
    <PageForm page={page} onCancel={onClose} />
  </Dialog>
);
