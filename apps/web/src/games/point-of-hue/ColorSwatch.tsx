import { mergeClassNames } from '@inithium/ui';

// A block of one exact color. Colors here are game data (any hex at all), not theme tokens, so this
// is an inline background rather than a Tailwind color class.
export const ColorSwatch = ({ hex, label, className }: { hex: string; label: string; className?: string }) => (
  <div role="img" aria-label={label} className={mergeClassNames('border border-surface-300', className)} style={{ backgroundColor: hex }} />
);
