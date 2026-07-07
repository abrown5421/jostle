import React, { useState } from 'react';
import { Image, Type, Music, Video, FileText, Folder } from 'lucide-react';
import { Box, Button, Text } from '@inithium/ui';
import type { Asset } from '@inithium/types';
import { CmsItemRow } from '@inithium/ui';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  image: <Image size={18} />,
  images: <Image size={18} />,
  font: <Type size={18} />,
  fonts: <Type size={18} />,
  audio: <Music size={18} />,
  video: <Video size={18} />,
  videos: <Video size={18} />,
  document: <FileText size={18} />,
  documents: <FileText size={18} />,
  other: <Folder size={18} />,
  misc: <Folder size={18} />,
};

const CATEGORY_COLOR: Record<string, string> = {
  image: 'bg-accent/10 text-accent',
  images: 'bg-accent/10 text-accent',
  font: 'bg-warning/10 text-warning',
  fonts: 'bg-warning/10 text-warning',
  audio: 'bg-success/10 text-success',
  video: 'bg-primary/10 text-primary',
  videos: 'bg-primary/10 text-primary',
  document: 'bg-surface3 text-secondary',
  documents: 'bg-surface3 text-secondary',
  other: 'bg-surface3 text-secondary',
  misc: 'bg-surface3 text-secondary',
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  image: 'text-accent',
  images: 'text-accent',
  font: 'text-warning',
  fonts: 'text-warning',
  audio: 'text-success',
  video: 'text-primary',
  videos: 'text-primary',
  document: 'text-secondary',
  documents: 'text-secondary',
  other: 'text-secondary',
  misc: 'text-secondary',
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageMime = (mime: string): boolean => mime?.startsWith('image/') ?? false;

const getProxyUrl = (asset: Asset): string => {
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_ORIGIN) ||
    'http://localhost:3000';
  return `${base}/api/assets/by-id/${asset._id}`;
};

export interface AssetGridProps {
  assets: readonly Asset[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onDelete: (asset: Asset) => void;
  searchQuery: string;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  selectedIds,
  onToggle,
  onDelete,
  searchQuery,
}) => {
  if (assets.length === 0) {
    return (
      <Box flex justify="center" align="center" className="py-16">
        <Text color="secondary">
          {searchQuery ? `No assets match "${searchQuery}"` : 'No assets found in this category.'}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex direction="col" className="gap-1.5">
      {assets.map((asset) => (
        <AssetRow
          key={asset._id}
          asset={asset}
          isSelected={selectedIds.has(asset._id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

interface AssetRowProps {
  asset: Asset;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onDelete: (asset: Asset) => void;
}

const AssetRow: React.FC<AssetRowProps> = ({ asset, isSelected, onToggle, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const isImage = isImageMime(asset.mimetype ?? '');
  const proxyUrl = getProxyUrl(asset);
  const displayName = asset.original_name ?? asset.filename ?? asset.storage_key ?? 'Unnamed';
  const catColor = CATEGORY_COLOR[asset.category ?? 'misc'] ?? CATEGORY_COLOR['misc'];
  const catIcon = CATEGORY_ICON[asset.category ?? 'misc'] ?? CATEGORY_ICON['misc'];
  const catIconColor =
    CATEGORY_ICON_COLOR[asset.category ?? 'misc'] ?? CATEGORY_ICON_COLOR['misc'];

  return (
    <CmsItemRow
      isSelected={isSelected}
      onToggle={() => onToggle(asset._id)}
      thumbnailSlot={
        isImage && !imgError ? (
          <img
            src={proxyUrl}
            alt={displayName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={catIconColor} aria-label={asset.category ?? 'file'}>
            {catIcon}
          </span>
        )
      }
      infoSlot={
        <>
          <Text variant="body2" overrideClassName="font-semibold text-sm text-primary truncate">
            {displayName}
          </Text>
          <Text variant="caption" color="secondary" overrideClassName="text-xs truncate">
            {asset.mimetype ?? asset.category ?? '—'}
          </Text>
        </>
      }
      badgesSlot={
        <>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
            {asset.category ?? 'misc'}
          </span>
          <Text
            variant="caption"
            color="secondary"
            overrideClassName="text-xs min-w-[52px] text-right"
          >
            {formatBytes(asset.size ?? 0)}
          </Text>
        </>
      }
      actionsSlot={
        <>
          <Button
            variant="ghost"
            color="danger"
            size="sm"
            rounded
            icon="trash-2"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(asset);
            }}
          />
        </>
      }
    />
  );
};
