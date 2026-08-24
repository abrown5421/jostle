import { Button } from '@jostle/ui';
import type { KickButtonProps } from './types.js';

export function KickButton({ onClick, className }: KickButtonProps) {
  return (
    <Button color="secondary" onClick={onClick} className={className}>
      Kick
    </Button>
  );
}
