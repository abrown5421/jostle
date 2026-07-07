import { Box, Button, Text } from '@inithium/ui';
import React, { useState } from 'react';
import FontPickerDialog from './font-picker-dialog';

interface FontPickerFieldProps {
  value: string;
  onChange: (val: string) => void;
}

const FontPickerField: React.FC<FontPickerFieldProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box flex align="center" className="gap-3">
        {value ? (
          <Box
            flex
            align="center"
            className="gap-2 px-2 py-1 rounded-md border border-surface4 bg-surface2"
          >
            <Text
              variant="caption"
              overrideClassName="text-xs text-surface-contrast truncate max-w-40"
            >
              {value.split('/').pop()}
            </Text>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-secondary hover:text-danger transition-colors ml-1 shrink-0"
              aria-label="Clear selection"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </Box>
        ) : (
          <Text variant="caption" color="secondary" overrideClassName="text-xs italic">
            No font selected
          </Text>
        )}
        <Button
          size="sm"
          color="secondary"
          variant="outline"
          leadingIcon="type"
          onClick={() => setOpen(true)}
        >
          {value ? 'Change' : 'Select Font'}
        </Button>
      </Box>

      <FontPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        selectedUrl={value}
      />
    </>
  );
};

export default FontPickerField;