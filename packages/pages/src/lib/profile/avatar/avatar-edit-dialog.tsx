import {
  AutoIncrementingList,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Box,
  Button,
  ColorPicker,
  Dialog,
  Input,
  Text,
  Switch,
} from '@inithium/ui';
import React from 'react';
import { ExtractedAvatarProps } from './avatar-utils';
import { useAvatarForm } from './use-avatar-form';

interface AvatarEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileUser: any;
  activeUser: any;
  avatar: ExtractedAvatarProps;
}

export const AvatarEditDialog: React.FC<AvatarEditDialogProps> = ({
  isOpen,
  onClose,
  profileUser,
  activeUser,
  avatar,
}) => {
  const {
    formState,
    pendingFile,
    uploadStatus,
    uploadError,
    isBusy,
    previewSrc,
    previewBackground,
    fileInputRef,
    handleUpdateMode,
    handleUpdateShape,
    handleUrlInputChange,
    handleFileSelect,
    handleRemovePendingFile,
    handleColorChange,
    handleAddColor,
    handleRemoveColor,
    handleFontColorChange,
    handleSave,
    resetUploadState,
  } = useAvatarForm({ profileUser, activeUser });

  const handleClose = () => {
    if (!isBusy) {
      resetUploadState();
      onClose();
    }
  };

  const dialogActions = [
    {
      label: 'Cancel',
      variant: 'solid' as const,
      color: 'danger' as const,
      onClick: (close: () => void) => { resetUploadState(); close(); },
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

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title="Edit Profile Avatar"
      size="xl"
      actions={dialogActions}
    >
      <Box flex direction="col" className="gap-2 py-2">

        <Box>
          <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-2">
            Avatar Asset Source
          </Text>
          <Switch
            label="Use custom image asset"
            checked={formState.mode === 'image'}
            onChange={(checked) => handleUpdateMode(checked ? 'image' : 'gradient')()}
            color="primary"
          />
        </Box>

        <Box flex direction="col" align="center" justify="center" padding="md" borderRadius="xl" className="border border-surface3-contrast">
          <Avatar
            src={previewSrc}
            fallback={avatar.fallback}
            size="lg"
            shape={formState.shape}
            background={formState.mode === 'gradient' ? previewBackground : undefined}
            fontColor={formState.fontColor}
          >
            {previewSrc && <AvatarImage src={previewSrc} alt="Preview Avatar" />}
            <AvatarFallback>{avatar.fallback}</AvatarFallback>
          </Avatar>
          {uploadStatus === 'requesting-intent' && (
            <Text variant="caption" overrideClassName="text-surface3-contrast mt-2 text-xs">Preparing upload…</Text>
          )}
          {uploadStatus === 'uploading' && (
            <Text variant="caption" overrideClassName="text-surface3-contrast mt-2 text-xs">Uploading image…</Text>
          )}
          {uploadStatus === 'done' && (
            <Text variant="caption" overrideClassName="text-green-500 mt-2 text-xs">Upload complete</Text>
          )}
        </Box>

        <Box className="my-2">
          <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-1">
            Geometric Silhouette
          </Text>
          <Switch
            label={formState.shape === 'circle' ? "Circular" : "Square"}
            checked={formState.shape === 'circle'}
            onChange={(checked) => handleUpdateShape(checked ? 'circle' : 'square')()}
            color="primary"
          />
        </Box>

        {formState.mode === 'image' ? (
          <Box flex direction="col" className="gap-4">
            <Box className="my-2">
              <Input
                label="Image Source Location"
                fullWidth
                placeholder="https://example.com/image.png or /assets/avatars/user.png"
                value={formState.src}
                onChange={handleUrlInputChange}
                disabled={!!pendingFile}
              />
            </Box>

            <Box flex direction="col" align="center" className="relative w-full">
              <Box flex align="center" justify="center" className="w-full gap-2 my-1">
                <Box className="h-px bg-slate-200 grow" />
                <Text variant="caption" overrideClassName="text-surface3-contrast font-medium px-2">OR</Text>
                <Box className="h-px bg-slate-200 grow" />
              </Box>
              <Box className="w-full my-2">
                <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block">
                  Upload Local Image
                </Text>
                <label className="block w-full cursor-pointer">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Box flex direction="col" align="center" justify="center" padding="lg" borderRadius="lg" className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-150">
                    <Text variant="subtitle2" overrideClassName="text-slate-600 font-semibold">
                      {pendingFile ? pendingFile.name : 'Click to upload asset file'}
                    </Text>
                    <Text variant="caption" overrideClassName="text-surface3-contrast mt-1">
                      PNG, JPG, or GIF up to 5MB
                    </Text>
                  </Box>
                </label>
                
              {pendingFile && (
                <Box flex align="center" className='my-2'>
                  <Button variant="outline" color="primary" size="sm" onClick={handleRemovePendingFile}>
                    Remove
                  </Button>
                </Box>
              )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box className="my-2">
            <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-1">
                Initials Text Color
            </Text>
            <ColorPicker
                label="Font color"
                fullWidth
                value={formState.fontColor}
                onColorChange={handleFontColorChange}
            />
            <Text variant="caption" overrideClassName="text-xs font-semibold uppercase tracking-wider text-surface3-contrast block mb-1">
              Color Vector Elements
            </Text>
            <Box borderRadius="lg" className="max-h-[220px] overflow-y-auto pr-2 border border-surface3-contrast p-2 bg-slate-50/50 relative">
              <AutoIncrementingList
                items={formState.colors}
                onAdd={handleAddColor}
                onRemove={handleRemoveColor}
                renderItem={(item, index) => (
                  <Box className="relative mb-2 last:mb-0">
                    <ColorPicker label="Gradient color" fullWidth value={item} onColorChange={handleColorChange(index)} />
                  </Box>
                )}
              />
            </Box>
          </Box>
        )}

        {uploadError && (
          <Text variant="caption" overrideClassName="text-red-500 text-xs mt-1">
            {uploadError}
          </Text>
        )}

      </Box>
    </Dialog>
  );
};