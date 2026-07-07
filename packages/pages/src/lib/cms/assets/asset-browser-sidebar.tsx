import React, { useMemo } from 'react';
import { Box, Text } from '@inithium/ui';
import type { Asset } from '@inithium/types';
import type { AssetCategory, AssetOwnerContext } from './cms-assets';

interface SidebarCategory {
  key: AssetCategory;
  label: string;
  icon: string;
  schemaValues: string[];
}

const CATEGORIES: SidebarCategory[] = [
  { key: 'all', label: 'All Assets', icon: 'layers', schemaValues: [] },
  { key: 'images', label: 'Images', icon: 'image', schemaValues: ['image', 'images'] },
  { key: 'fonts', label: 'Fonts', icon: 'type', schemaValues: ['font', 'fonts'] },
  { key: 'audio', label: 'Audio', icon: 'music', schemaValues: ['audio'] },
  { key: 'videos', label: 'Videos', icon: 'video', schemaValues: ['video', 'videos'] },
  { key: 'documents', label: 'Documents', icon: 'file-text', schemaValues: ['document', 'documents'] },
  { key: 'misc', label: 'Other', icon: 'file', schemaValues: ['misc', 'other'] },
];

const OWNER_CONTEXTS: { key: AssetOwnerContext; label: string; icon: string }[] = [
  { key: 'all', label: 'All Sources', icon: 'globe' },
  { key: 'app', label: 'App Assets', icon: 'layout-dashboard' },
  { key: 'user', label: 'User Assets', icon: 'users' },
];

export interface AssetBrowserSidebarProps {
  selectedCategory: AssetCategory;
  selectedOwnerContext: AssetOwnerContext;
  assets: readonly Asset[];
  onCategoryChange: (cat: AssetCategory) => void;
  onOwnerContextChange: (ctx: AssetOwnerContext) => void;
}

export const AssetBrowserSidebar: React.FC<AssetBrowserSidebarProps> = ({
  selectedCategory,
  selectedOwnerContext,
  assets,
  onCategoryChange,
  onOwnerContextChange,
}) => {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    for (const cat of CATEGORIES) {
      if (cat.key === 'all') continue;
      counts[cat.key] = assets.filter((a) => cat.schemaValues.includes(a.category ?? '')).length;
    }
    return counts;
  }, [assets]);

  const ownerCounts = useMemo(
    () => ({
      all: assets.length,
      app: assets.filter((a) => a.owner_type === 'app').length,
      user: assets.filter((a) => a.owner_type === 'user').length,
    }),
    [assets],
  );

  return (
    <Box
      flex
      direction="col"
      className="w-64 shrink-0 h-full border-r border-surface3 overflow-y-auto"
      padding="sm"
    >
      <Box flex direction="col" className="gap-1 mb-4">
        <Text
          variant="caption"
          overrideClassName="text-xs font-bold uppercase tracking-wider text-secondary px-2 mb-1"
        >
          Type
        </Text>
        {CATEGORIES.map((cat) => (
          <SidebarNavItem
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            count={categoryCounts[cat.key] ?? 0}
            isActive={selectedCategory === cat.key}
            onClick={() => onCategoryChange(cat.key)}
          />
        ))}
      </Box>

      <Box className="border-t border-surface3 my-2" />

      <Box flex direction="col" className="gap-1">
        <Text
          variant="caption"
          overrideClassName="text-xs font-bold uppercase tracking-wider text-secondary px-2 mb-1"
        >
          Source
        </Text>
        {OWNER_CONTEXTS.map((ctx) => (
          <SidebarNavItem
            key={ctx.key}
            label={ctx.label}
            icon={ctx.icon}
            count={ownerCounts[ctx.key]}
            isActive={selectedOwnerContext === ctx.key}
            onClick={() => onOwnerContextChange(ctx.key)}
          />
        ))}
      </Box>
    </Box>
  );
};

interface SidebarNavItemProps {
  label: string;
  icon: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ label, count, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors text-left',
      isActive
        ? 'bg-primary text-primary-contrast font-semibold'
        : 'text-secondary hover:bg-surface2 hover:text-primary',
    ].join(' ')}
  >
    <span className="truncate">{label}</span>
    {count > 0 && (
      <span
        className={[
          'ml-1 text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium',
          isActive
            ? 'bg-primary-contrast/20 text-primary-contrast'
            : 'bg-surface3 text-secondary',
        ].join(' ')}
      >
        {count}
      </span>
    )}
  </button>
);
