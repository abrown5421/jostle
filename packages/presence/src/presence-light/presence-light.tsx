import { memo, useId, useState } from 'react';
import { cn } from '@jostle/ui';
import { STATUS_INDICATOR_CONFIG } from '../config/index.js';
import type { PresenceLightProps, PresenceLightSize } from './types.js';

const DOT_BASE_CLASS =
  'inline-block rounded-full border-2 border-surface-primary transition-colors duration-300 ease-out';

const DOT_SIZE_CLASS: Record<PresenceLightSize, string> = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

const TOOLTIP_BASE_CLASS =
  'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-content-primary shadow-md transition-opacity duration-150';

export const PresenceLight = memo(function PresenceLight({ status, size = 'md', className }: PresenceLightProps) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const tooltipId = useId();
  const config = STATUS_INDICATOR_CONFIG[status];

  return (
    <span className="relative inline-flex">
      <span
        role="status"
        aria-live="polite"
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        className={cn(DOT_BASE_CLASS, DOT_SIZE_CLASS[size], config.indicatorClassName, className)}
      />
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(TOOLTIP_BASE_CLASS, isTooltipVisible ? 'opacity-100' : 'opacity-0')}
      >
        {config.label}
      </span>
    </span>
  );
});
