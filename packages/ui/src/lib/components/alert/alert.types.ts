import { AlertProps } from '@inithium/types';

export interface ManagedAlertProps {
  alertData: AlertProps;
  onDismiss: () => void;
  onExited: () => void;
}