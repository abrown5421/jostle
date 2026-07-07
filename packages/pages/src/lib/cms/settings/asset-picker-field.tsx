import { AssetPickerField as BaseAssetPickerField } from '@inithium/ui'; //Module '"@inithium/ui"' has no exported member 'AssetPickerField'.ts(2305)
import type {  AssetPickerItem } from '@inithium/ui'; //Module '"@inithium/ui"' has no exported member 'AssetPickerItem'.ts(2305)
import React, { useMemo } from 'react';
import { useGetAssetsQuery } from '@inithium/store';
import type { Asset } from '@inithium/types';
import FontPickerField from './font-picker-field';
import { getProxyUrl } from './utils';

const toPickerItem = (asset: Asset): AssetPickerItem => ({
  id: asset._id,
  url: getProxyUrl(asset),
  name: asset.original_name ?? asset.filename ?? asset.storage_key,
});

const FONT_KEYS = new Set(['primary-font-asset', 'secondary-font-asset']);

interface SettingPickerFieldProps {
  settingKey: string;
  value: string;
  onChange: (val: string) => void;
}

const SettingPickerField: React.FC<SettingPickerFieldProps> = ({ settingKey, value, onChange }) => {
  const { data: assets } = useGetAssetsQuery();

  const pickerAssets = useMemo<AssetPickerItem[]>(
    () =>
      (assets ?? [])
        .filter((a) => a.owner_type === 'app' && a.category === 'image')
        .map(toPickerItem),
    [assets],
  );

  if (FONT_KEYS.has(settingKey)) {
    return <FontPickerField value={value} onChange={onChange} />;
  }

  return <BaseAssetPickerField value={value} onChange={onChange} assets={pickerAssets} />;
};

export default SettingPickerField;