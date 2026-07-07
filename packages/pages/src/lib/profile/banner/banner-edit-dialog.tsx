import {
  AutoIncrementingList,
  Box,
  Banner,
  Button,
  ColorPicker,
  Dialog,
  Input,
  Text,
  Slider,
  Switch,
} from '@inithium/ui';
import React from 'react';
import { useBannerForm } from './use-banner-form';

interface BannerEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileUser: any;
  activeUser: any;
}

export const BannerEditDialog: React.FC<BannerEditDialogProps> = ({
  isOpen,
  onClose,
  profileUser,
  activeUser,
}) => {
  const {
    formState,
    pendingFile,
    uploadStatus,
    uploadError,
    isBusy,
    saveError,
    previewSrc,
    fileInputRef,
    handleUpdateMode,
    handleUrlInputChange,
    handleFileSelect,
    handleRemovePendingFile,
    handleVarianceChange,
    handleCellSizeChange,
    handleXColorChange,
    handleYColorChange,
    handleAddXColor,
    handleAddYColor,
    handleRemoveXColor,
    handleRemoveYColor,
    handleSave,
    resetFormState,
  } = useBannerForm({ profileUser, activeUser });

  const handleClose = () => {
    if (!isBusy) {
      resetFormState();
      onClose();
    }
  };

  const dialogActions = [
    {
      label: 'Cancel',
      variant: 'solid' as const,
      color: 'danger' as const,
      onClick: (close: () => void) => { resetFormState(); close(); },
    },
    {
      label: isBusy
        ? uploadStatus === 'uploading' ? 'Uploading…' : 'Saving…'
        : 'Save Changes',
      variant: 'solid' as const,
      color: 'primary' as const,
      disabled: isBusy,
      onClick: (close: () => void) => handleSave(close),
    },
  ];

  const previewOptions =
    formState.mode === 'trianglify'
      ? {
          variance: formState.variance,
          cell_size: formState.cellSize,
          x_colors: formState.xColors,
          y_colors: formState.yColors,
        }
      : {};

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title="Edit Profile Banner"
      size="xl"
      actions={dialogActions}
    >
      <Box flex direction="col" className="gap-4 py-2">

        <Box>
          <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-2">
            Banner Asset Source
          </Text>
          <Switch
            label="Use custom image asset"
            checked={formState.mode === 'image'}
            onChange={(checked) => handleUpdateMode(checked ? 'image' : 'trianglify')()}
            color="primary"
          />
        </Box>

        <Box flex direction="col" align="center" justify="center" borderRadius="xl" className="overflow-hidden border border-slate-100">
          <Banner
            src={previewSrc}
            alt="Banner preview"
            height="140px"
            options={previewOptions}
          />
          {formState.mode === 'image' && uploadStatus === 'requesting-intent' && (
            <Text variant="caption" overrideClassName="text-slate-400 mt-2 text-xs pb-1">Preparing upload…</Text>
          )}
          {formState.mode === 'image' && uploadStatus === 'uploading' && (
            <Text variant="caption" overrideClassName="text-slate-400 mt-2 text-xs pb-1">Uploading image…</Text>
          )}
          {formState.mode === 'image' && uploadStatus === 'done' && (
            <Text variant="caption" overrideClassName="text-green-500 mt-2 text-xs pb-1">Upload complete</Text>
          )}
        </Box>

        {formState.mode === 'image' ? (
          <Box flex direction="col" className="gap-4">
            <Box>
              <Input
                label="Image Source Location"
                fullWidth
                placeholder="https://example.com/banner.png or /assets/banners/hero.jpg"
                value={formState.src}
                onChange={handleUrlInputChange}
                disabled={!!pendingFile}
              />
            </Box>

            <Box flex direction="col" align="center" className="relative w-full">
              <Box flex align="center" justify="center" className="w-full gap-2 my-1">
                <Box className="h-px bg-slate-200 grow" />
                <Text variant="caption" overrideClassName="text-slate-400 font-medium px-2">OR</Text>
                <Box className="h-px bg-slate-200 grow" />
              </Box>

              <Box className="w-full my-2">
                <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block">
                  Upload Local Image
                </Text>
                <label className="block w-full cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Box
                    flex
                    direction="col"
                    align="center"
                    justify="center"
                    padding="lg"
                    borderRadius="lg"
                    className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-150"
                  >
                    <Text variant="subtitle2" overrideClassName="text-slate-600 font-semibold">
                      {pendingFile ? pendingFile.name : 'Click to upload asset file'}
                    </Text>
                    <Text variant="caption" overrideClassName="text-slate-400 mt-1">
                      PNG, JPG, GIF, or WebP up to 5MB
                    </Text>
                  </Box>
                </label>

                {pendingFile && (
                  <Box flex align="center" className="my-2">
                    <Button variant="outline" color="primary" size="sm" onClick={handleRemovePendingFile}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            {uploadError && (
              <Text variant="caption" overrideClassName="text-red-500 text-xs">
                {uploadError}
              </Text>
            )}
          </Box>
        ) : (
          <>
            <Box flex direction="col" className="gap-1">
              <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block">
                Variance
              </Text>
              <Text variant="caption" overrideClassName="text-slate-400 text-xs mb-1">
                Controls how much the cells deviate from a regular grid. Lower values produce uniform grids; higher values produce organic, irregular shapes.
              </Text>
              <Slider
                fullWidth
                color="primary"
                min={0}
                max={1}
                step={0.01}
                value={formState.variance}
                onChange={handleVarianceChange}
                showTooltip
                showLabels
                formatValue={(v) => v.toFixed(2)}
              />
            </Box>

            <Box flex direction="col" className="gap-1">
              <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block">
                Cell Size
              </Text>
              <Text variant="caption" overrideClassName="text-slate-400 text-xs mb-1">
                Controls the approximate size of each Voronoi cell in pixels. Smaller values produce finer detail; larger values produce broader shapes.
              </Text>
              <Slider
                fullWidth
                color="primary"
                min={10}
                max={200}
                step={1}
                value={formState.cellSize}
                onChange={handleCellSizeChange}
                showTooltip
                showLabels
                formatValue={(v) => `${v}px`}
              />
            </Box>

            <Box flex direction="row" className="gap-4">
              <Box flex direction="col" className="gap-1 flex-1 min-w-0">
                <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-1">
                  X Color Stops
                </Text>
                <Box borderRadius="lg" className="max-h-[220px] overflow-y-auto pr-2 border border-slate-100 p-2 bg-slate-50/50">
                  <AutoIncrementingList
                    items={formState.xColors}
                    onAdd={handleAddXColor}
                    onRemove={handleRemoveXColor}
                    renderItem={(item, index) => (
                      <Box className="relative mb-2 last:mb-0">
                        <ColorPicker label="X color" fullWidth value={item} onColorChange={handleXColorChange(index)} />
                      </Box>
                    )}
                  />
                </Box>
              </Box>

              <Box flex direction="col" className="gap-1 flex-1 min-w-0">
                <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-1">
                  Y Color Stops
                </Text>
                <Box borderRadius="lg" className="max-h-[220px] overflow-y-auto pr-2 border border-slate-100 p-2 bg-slate-50/50">
                  <AutoIncrementingList
                    items={formState.yColors}
                    onAdd={handleAddYColor}
                    onRemove={handleRemoveYColor}
                    renderItem={(item, index) => (
                      <Box className="relative mb-2 last:mb-0">
                        <ColorPicker label="Y color" fullWidth value={item} onColorChange={handleYColorChange(index)} />
                      </Box>
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}

        {saveError && (
          <Text variant="caption" overrideClassName="text-red-500 text-xs mt-1">
            {saveError}
          </Text>
        )}

      </Box>
    </Dialog>
  );
};