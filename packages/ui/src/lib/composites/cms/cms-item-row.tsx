import React from 'react';
import { Box } from '../../components/box';
import { Checkbox } from '../../components/checkbox';

export interface CmsItemRowProps {
  isSelected?: boolean;
  onToggle?: () => void;
  checkboxDisabled?: boolean;
  thumbnailSlot?: React.ReactNode;
  infoSlot: React.ReactNode;
  badgesSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
}

export const CmsItemRow: React.FC<CmsItemRowProps> = ({
  isSelected,
  onToggle,
  checkboxDisabled = false,
  thumbnailSlot,
  infoSlot,
  badgesSlot,
  actionsSlot,
}) => (
  <Box
    flex
    direction="row"
    justify="between"
    align="center"
    color="surface2"
    border
    borderWidth="thin"
    borderRadius="md"
    padding="md"
    fullWidth
    className={[
      'transition-colors hover:bg-surface3 gap-3 group',
      isSelected ? 'ring-2 ring-primary border-primary' : '',
    ].join(' ')}
  >
    <Box flex direction="row" align="center" className="gap-2.5 min-w-0 flex-1">
      {onToggle !== undefined && (
        <Box flex align="center" justify="center" className="w-5 h-5 shrink-0">
          <Checkbox
            checked={isSelected ?? false}
            onChange={onToggle}
            color="primary"
            size="md"
            disabled={checkboxDisabled}
          />
        </Box>
      )}

      {thumbnailSlot && (
        <Box
          flex
          align="center"
          justify="center"
          borderRadius="md"
          color="surface"
          borderWidth="thin"
          className="w-9 h-9 shrink-0 overflow-hidden mx-2"
        >
          {thumbnailSlot}
        </Box>
      )}

      <Box flex direction="col" className="min-w-0 flex-1">
        {infoSlot}
      </Box>
    </Box>

    {(badgesSlot || actionsSlot) && (
      <Box flex direction="row" align="center" className="gap-2 shrink-0">
        {badgesSlot}
        {actionsSlot && (
          <Box flex align="center" className="gap-0.5">
            {actionsSlot}
          </Box>
        )}
      </Box>
    )}
  </Box>
);