import { useEffect } from 'react';
import type { ReactNode, Ref } from 'react';
import { useEnterExitAnimation } from '../animation/index.js';
import { cn } from '../shared/index.js';
import type { DrawerTransitionConfig } from './types.js';

const DEFAULT_TRANSITION: DrawerTransitionConfig = {
  enter: { name: 'slideInRight', duration: 300 },
  exit: { name: 'slideOutRight', duration: 250 },
};

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  transition?: DrawerTransitionConfig;
  /** Rendered alongside the close button, in the same row. */
  header?: ReactNode;
  children: ReactNode;
}

/**
 * Slideout panel + backdrop. Content lifecycle (mount on open, unmount only
 * after the exit animation finishes) is handled by useEnterExitAnimation —
 * this component just supplies the backdrop, Escape-to-close, and layout.
 */
export function Drawer({ open, onClose, transition = DEFAULT_TRANSITION, header, children }: DrawerProps) {
  const { shouldRender, ref, className, style } = useEnterExitAnimation(open, transition);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-primary/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-6 overflow-y-auto bg-surface-secondary p-6 text-content-primary',
          className,
        )}
        style={style}
        role="dialog"
        aria-modal="true"
      >
        <div className={cn('flex items-center', header ? 'justify-between' : 'justify-end')}>
          {header}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="cursor-pointer text-content-secondary hover:text-content-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
