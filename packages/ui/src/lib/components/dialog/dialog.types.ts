import { DialogProps as HeadlessDialogProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';
import { ButtonSize } from '../button/button.types';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type DialogVariant = 'default' | 'alert' | 'drawer';

export type DialogDrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DialogAction {
  label: string;
  onClick: (close: () => void) => void;
  color?: ThemeColor;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: ButtonSize;
  leadingIcon?: string;
  trailingIcon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  closes?: boolean;
}

export interface DialogProps
  extends Omit<HeadlessDialogProps, 'onClose' | 'children' | 'role' | 'title'> {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  size?: DialogSize;
  variant?: DialogVariant;
  drawerPosition?: DialogDrawerPosition;
  actions?: DialogAction[];
  actionsAlign?: 'left' | 'right' | 'center' | 'between';
  backdrop?: boolean;
  transition?: boolean;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  panelClassName?: string;
  backdropClassName?: string;
  overridePanelClassName?: string;
  role?: 'dialog' | 'alertdialog';
}