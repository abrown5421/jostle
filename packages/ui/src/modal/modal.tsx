import { useEffect } from 'react';
import type { ReactNode, Ref } from 'react';
import { useEnterExitAnimation } from '../animation/index.js';
import type { EnterExitAnimationConfig } from '../animation/index.js';
import { cn } from '../shared/index.js';

const DEFAULT_TRANSITION: EnterExitAnimationConfig = {
  enter: { name: 'zoomIn', duration: 250 },
  exit: { name: 'zoomOut', duration: 200 },
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  transition?: EnterExitAnimationConfig;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered dialog + backdrop. Mirrors Drawer's lifecycle handling
 * (useEnterExitAnimation keeps content mounted through the exit
 * animation) but lays out as a centered card instead of a slideout panel.
 */
export function Modal({
  open,
  onClose,
  title,
  transition = DEFAULT_TRANSITION,
  children,
  footer,
}: ModalProps) {
  const { shouldRender, ref, className, style } = useEnterExitAnimation(
    open,
    transition,
  );

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
      <div
        className="fixed inset-0 z-40 bg-surface-primary/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={ref as Ref<HTMLDivElement>}
          className={cn(
            'flex w-full max-w-md flex-col gap-6 rounded-lg border border-surface-tertiary bg-surface-secondary p-6 text-content-primary',
            className,
          )}
          style={style}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between">
            {title && (
              <span className="text-lg font-bold text-content-primary">
                {title}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto cursor-pointer text-content-secondary hover:text-content-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
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
          {footer && (
            <div className="flex items-center justify-end gap-3">{footer}</div>
          )}
        </div>
      </div>
    </>
  );
}
