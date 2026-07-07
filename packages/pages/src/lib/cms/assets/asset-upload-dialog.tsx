import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Dialog, Text, Combobox, ComboboxOption } from '@inithium/ui';
import { useReadAllUsersQuery } from '@inithium/store';
import type {
  CreateAssetIntentDto,
  AssetIntentResponseDto,
  AssetUploadResponseDto,
} from '@inithium/store';

interface StoreUser {
  _id: { $oid: string };
  email: string;
  first_name: string;
  last_name: string;
}

type UploadStatus = 'pending' | 'intent' | 'uploading' | 'done' | 'error';

interface FileEntry {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface AssetUploadDialogProps {
  open: boolean;
  defaultOwnerContext: 'app' | 'user';
  onClose: () => void;
  onComplete: (count: number) => void;
  createAssetIntent: (dto: CreateAssetIntentDto) => { unwrap: () => Promise<AssetIntentResponseDto> };
  uploadAssetBinary: (args: {
    uploadUrl: string;
    file: File | Blob;
  }) => { unwrap: () => Promise<AssetUploadResponseDto> };
}

const ACCEPTED_TYPES = [
  'image/*',
  'font/*',
  'audio/*',
  'video/*',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-opentype',
].join(',');

let idSeq = 0;
const nextId = () => `upload-${++idSeq}`;

const EXT_MIME_MAP: Record<string, string> = {
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.sfnt': 'font/sfnt',
};

const resolveMimeType = (file: File): string => {
  const reported = file.type;
  if (reported && reported !== 'application/octet-stream') return reported;
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return EXT_MIME_MAP[ext] ?? 'application/octet-stream';
};

const uploadWithProgress = (
  url: string,
  file: File,
  mimeType: string,
  onProgress: (pct: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', mimeType);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.send(file);
  });

export const AssetUploadDialog: React.FC<AssetUploadDialogProps> = ({
  open,
  defaultOwnerContext,
  onClose,
  onComplete,
  createAssetIntent,
}) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ownerType, setOwnerType] = useState<'app' | 'user'>(defaultOwnerContext);
  const [ownerId, setOwnerId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: usersResult, isLoading: usersLoading } = useReadAllUsersQuery();

  const typedUsers = (usersResult?.data ?? []) as unknown as StoreUser[];

  const comboboxOptions = React.useMemo((): ComboboxOption<string>[] => {
    const q = userQuery.toLowerCase();
    return typedUsers
      .filter(
        (u: StoreUser) =>
          q === '' ||
          u.first_name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
      .map(
        (u: StoreUser): ComboboxOption<string> => ({
          value: u._id.$oid,
          label: `${u.first_name} ${u.last_name} (${u.email})`,
        }),
      );
  }, [typedUsers, userQuery]);

  const emailByOid = React.useMemo(
    (): Record<string, string> =>
      Object.fromEntries(typedUsers.map((u: StoreUser) => [u._id.$oid, u.email])),
    [typedUsers],
  );

  const ownerIdRequired = ownerType === 'user';
  const canUpload =
    files.length > 0 && !isUploading && (!ownerIdRequired || ownerId.trim() !== '');

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: nextId(),
        file: f,
        status: 'pending' as UploadStatus,
        progress: 0,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateEntry = (id: string, patch: Partial<FileEntry>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleUpload = async () => {
    if (!canUpload) return;
    setIsUploading(true);

    let successCount = 0;

    for (const entry of files) {
      if (entry.status === 'done') {
        successCount++;
        continue;
      }

      updateEntry(entry.id, { status: 'intent', progress: 0 });
      try {
        const mimeType = resolveMimeType(entry.file);

        const intentDto: CreateAssetIntentDto = {
          filename: entry.file.name,
          mimeType,
          size: entry.file.size,
          ownerType,
          ownerId: ownerType === 'user' ? ownerId.trim() : null,
        };

        const intent = await createAssetIntent(intentDto).unwrap();

        updateEntry(entry.id, { status: 'uploading' });

        const base =
          (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_ORIGIN) ||
          'http://localhost:3000';

        const fullUploadUrl = `${base}/api/asset-manager${intent.uploadUrl}`;

        await uploadWithProgress(fullUploadUrl, entry.file, mimeType, (pct) =>
          updateEntry(entry.id, { progress: pct }),
        );

        updateEntry(entry.id, { status: 'done', progress: 100 });
        successCount++;
      } catch (err: any) {
        const msg = err?.data?.message ?? err?.message ?? 'Upload failed';
        updateEntry(entry.id, {
          status: 'error',
          error: typeof msg === 'string' ? msg : 'Upload failed',
        });
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setTimeout(() => {
        onComplete(successCount);
        resetDialog();
      }, 600);
    }
  };

  const resetDialog = () => {
    setFiles([]);
    setOwnerType(defaultOwnerContext);
    setOwnerId('');
    setUserQuery('');
  };

  const handleClose = () => {
    if (isUploading) return;
    resetDialog();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Upload Assets"
      size="xl"
      variant="default"
      backdrop={true}
      transition={true}
      closeOnBackdropClick={!isUploading}
      showCloseButton={!isUploading}
    >
      <Box flex direction="col" className="gap-4 py-2">
        <Box flex direction="col" className="gap-2">
          <Text variant="body2" overrideClassName="text-sm font-semibold">
            Asset Owner
          </Text>

          <Box flex align="center" className="gap-2">
            {(['app', 'user'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="ownerType"
                  value={t}
                  checked={ownerType === t}
                  onChange={() => {
                    setOwnerType(t);
                    setOwnerId('');
                    setUserQuery('');
                  }}
                  disabled={isUploading}
                  className="accent-primary"
                />
                {t === 'app' ? 'App asset' : 'User asset'}
              </label>
            ))}
          </Box>

          {ownerType === 'user' && (
            <Box flex direction="col" className="gap-2 my-2">
              <Combobox<string>
                label={usersLoading ? 'Loading users…' : 'Search user by name or email *'}
                options={comboboxOptions}
                value={ownerId || null}
                onChange={(val) => setOwnerId(val ?? '')}
                onQueryChange={setUserQuery}
                color="primary"
                variant="outline"
                size="md"
                fullWidth
                leadingIcon="user"
                disabled={isUploading || usersLoading}
              />
              {ownerId && emailByOid[ownerId] && (
                <Text variant="caption" overrideClassName="text-xs text-secondary pl-1">
                  {emailByOid[ownerId]}
                </Text>
              )}
            </Box>
          )}
        </Box>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 transition-colors',
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-surface3 hover:border-primary/50',
          ].join(' ')}
        >
          <Text variant="body2" overrideClassName="text-sm font-medium">
            Drop files here or click to browse
          </Text>
          <Text variant="caption" color="secondary" overrideClassName="text-xs text-center">
            Images, fonts, audio, video, documents
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <Box flex direction="col" className="gap-2 max-h-56 overflow-y-auto">
            {files.map((entry) => (
              <FileRow
                key={entry.id}
                entry={entry}
                onRemove={removeFile}
                isUploading={isUploading}
              />
            ))}
          </Box>
        )}

        <Box flex justify="end" className="gap-2 mt-2">
          <Button
            variant="ghost"
            color="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!canUpload}
            leadingIcon={isUploading ? undefined : 'upload'}
            type="button"
          >
            {isUploading
              ? `Uploading… (${files.filter((f) => f.status === 'done').length}/${files.length})`
              : `Upload${files.length > 0 ? ` ${files.length} File${files.length !== 1 ? 's' : ''}` : ''}`}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

interface FileRowProps {
  entry: FileEntry;
  onRemove: (id: string) => void;
  isUploading: boolean;
}

const STATUS_ICON: Record<UploadStatus, string> = {
  pending: '⏳',
  intent: '🔗',
  uploading: '📤',
  done: '✅',
  error: '❌',
};

const FileRow: React.FC<FileRowProps> = ({ entry, onRemove, isUploading }) => {
  const sizeMB = (entry.file.size / (1024 * 1024)).toFixed(2);

  return (
    <Box flex direction="col" color="surface" borderRadius="md" className="px-3 py-2 gap-2">
      <Box flex align="center" justify="between">
        <Box flex align="center" className="gap-2 min-w-0">
          <span className="text-sm shrink-0">{STATUS_ICON[entry.status]}</span>
          <Text variant="caption" overrideClassName="text-xs font-medium truncate">
            {entry.file.name}
          </Text>
          <Text variant="caption" color="secondary" overrideClassName="text-xs shrink-0">
            {sizeMB} MB
          </Text>
        </Box>
        {entry.status !== 'done' && !isUploading && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-secondary hover:text-danger text-xs ml-2 shrink-0"
            aria-label="Remove file"
          >
            ✕
          </button>
        )}
      </Box>

      {(entry.status === 'uploading' || entry.status === 'done') && (
        <div className="w-full bg-surface3 rounded-full h-1.5 overflow-hidden">
          <div
            className={[
              'h-full rounded-full transition-all duration-300',
              entry.status === 'done' ? 'bg-success' : 'bg-primary',
            ].join(' ')}
            style={{ width: `${entry.progress}%` }}
          />
        </div>
      )}

      {entry.status === 'error' && entry.error && (
        <Text variant="caption" overrideClassName="text-xs text-danger">
          {entry.error}
        </Text>
      )}
    </Box>
  );
};
