import { Avatar, Banner, Button, FileDropzone, Modal, Text } from '@jostle/ui';
import { useEffect, useState } from 'react';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

export interface MediaUploadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  currentImageUrl?: string;
  previewShape: 'circle' | 'rect';
  onUpload: (file: File) => Promise<void>;
}

export function MediaUploadModal({
  open,
  onClose,
  title,
  currentImageUrl,
  previewShape,
  onUpload,
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl(undefined);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleSave = async () => {
    if (!file) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpload(file);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Upload failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const shownImageUrl = previewUrl ?? currentImageUrl;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
          <Button onClick={handleSave} disabled={!file || isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        {previewShape === 'circle' ? (
          <Avatar imageUrl={shownImageUrl} size="lg" />
        ) : (
          <Banner imageUrl={shownImageUrl} className="h-32 w-full rounded-lg" />
        )}
        <FileDropzone
          onFileSelected={setFile}
          accept={ACCEPTED_TYPES}
          disabled={isSubmitting}
        />
        {error && (
          <Text fontSize="sm" className="text-red-400">
            {error}
          </Text>
        )}
      </div>
    </Modal>
  );
}
