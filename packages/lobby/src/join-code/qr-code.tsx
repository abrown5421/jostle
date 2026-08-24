import { cn } from '@jostle/ui';
import QRCode from 'react-qr-code';
import type { QrCodeProps } from './types.js';

export function QrCode({ joinCode, size = 180, className }: QrCodeProps) {
  const value = `${window.location.origin}/join?code=${joinCode}`;

  return (
    <div className={cn('rounded-lg bg-content-primary p-3', className)}>
      <QRCode value={value} size={size} />
    </div>
  );
}
