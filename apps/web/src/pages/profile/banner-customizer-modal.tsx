import {
  MAX_CELL_SIZE,
  MAX_COLORS_PER_AXIS,
  MAX_VARIANCE,
  MIN_CELL_SIZE,
  MIN_COLORS_PER_AXIS,
  MIN_VARIANCE,
} from '@jostle/profile-appearance';
import type { BannerConfig } from '@jostle/profile-appearance';
import { Banner, Button, Container, Modal, Slider, Text } from '@jostle/ui';
import { useEffect, useState } from 'react';

const NEW_COLOR = '#ffffff';

function ColorListEditor({
  label,
  colors,
  onChange,
}: {
  label: string;
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  return (
    <Container direction="col" gap={2}>
      <Text fontSize="sm" fontWeight="medium" textColor="content-secondary">
        {label}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-1">
            <input
              type="color"
              value={color}
              onChange={(event) =>
                onChange(
                  colors.map((c, i) => (i === index ? event.target.value : c)),
                )
              }
              aria-label={`${label} ${index + 1}`}
              className="h-8 w-8 cursor-pointer rounded border border-content-tertiary bg-transparent p-0"
            />
            {colors.length > MIN_COLORS_PER_AXIS && (
              <button
                type="button"
                onClick={() => onChange(colors.filter((_, i) => i !== index))}
                aria-label={`Remove ${label} ${index + 1}`}
                className="cursor-pointer text-content-tertiary hover:text-content-primary"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {colors.length < MAX_COLORS_PER_AXIS && (
          <button
            type="button"
            onClick={() => onChange([...colors, NEW_COLOR])}
            aria-label={`Add ${label}`}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-dashed border-content-tertiary text-content-tertiary hover:border-content-secondary hover:text-content-secondary"
          >
            +
          </button>
        )}
      </div>
    </Container>
  );
}

export interface BannerCustomizerModalProps {
  open: boolean;
  onClose: () => void;
  currentConfig: BannerConfig;
  onSave: (config: BannerConfig) => Promise<void>;
}

export function BannerCustomizerModal({
  open,
  onClose,
  currentConfig,
  onSave,
}: BannerCustomizerModalProps) {
  const [draft, setDraft] = useState<BannerConfig>(currentConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(currentConfig);
      setError(null);
    }
  }, [open, currentConfig]);

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(draft);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Banner"
      footer={
        <>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Container direction="col" gap={4}>
        <Banner pattern={draft} className="h-32 w-full rounded-lg" />

        <Slider
          label="Cell Size"
          min={MIN_CELL_SIZE}
          max={MAX_CELL_SIZE}
          value={draft.cellSize}
          setValue={(cellSize) => setDraft({ ...draft, cellSize })}
          color="primary"
        />
        <Slider
          label="Variance"
          min={MIN_VARIANCE}
          max={MAX_VARIANCE}
          step={0.05}
          value={draft.variance}
          setValue={(variance) => setDraft({ ...draft, variance })}
          color="secondary"
        />

        <ColorListEditor
          label="Horizontal Colors"
          colors={draft.xColors}
          onChange={(xColors) => setDraft({ ...draft, xColors })}
        />
        <ColorListEditor
          label="Vertical Colors"
          colors={draft.yColors}
          onChange={(yColors) => setDraft({ ...draft, yColors })}
        />

        {error && (
          <Text fontSize="sm" className="text-red-400">
            {error}
          </Text>
        )}
      </Container>
    </Modal>
  );
}
