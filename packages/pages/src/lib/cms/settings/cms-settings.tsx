import { Box, Button, Switch, Text } from '@inithium/ui';
import { CmsDataPage, CmsItemRow } from '@inithium/ui';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  selectAllSettings,
  useReadAllSettingsQuery,
  useUpdateSettingMutation,
} from '@inithium/store';
import { SECTION_KEYS, SETTING_DESCRIPTIONS, SETTING_LABELS } from './constants';
import type { SettingItem } from './utils';
import SectionLabel from './section-label';
import SettingPickerField from './asset-picker-field';

const CmsSettingsPage: React.FC = () => {
  useReadAllSettingsQuery();
  const settings = useSelector(selectAllSettings) as SettingItem[];
  const [updateSetting] = useUpdateSettingMutation();

  const [localValues, setLocalValues] = useState<Record<string, string | boolean>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (settings.length > 0) {
      const initial: Record<string, string | boolean> = {};
      settings.forEach((s) => {
        initial[s.key] = s.value as string | boolean;
      });
      setLocalValues(initial);
    }
  }, [settings]);

  const handleBooleanChange = (key: string, checked: boolean) => {
    setLocalValues((prev) => ({ ...prev, [key]: checked }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  };

  const handleStringChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  };

  const handleSave = async (setting: SettingItem) => {
    setSavingKeys((prev) => new Set(prev).add(setting.key));
    try {
      await updateSetting({
        id: setting._id,
        data: { value: localValues[setting.key] },
      }).unwrap();
      setDirtyKeys((prev) => {
        const next = new Set(prev);
        next.delete(setting.key);
        return next;
      });
    } catch (err) {
      console.error('Failed to update setting:', err);
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(setting.key);
        return next;
      });
    }
  };

  const settingsByKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  const filteredSections = Object.entries(SECTION_KEYS).reduce<Record<string, SettingItem[]>>(
    (acc, [section, keys]) => {
      const q = searchQuery.trim().toLowerCase();
      const matched = keys
        .map((k) => settingsByKey[k])
        .filter(Boolean)
        .filter(
          (s) =>
            !q ||
            s.key.toLowerCase().includes(q) ||
            (SETTING_LABELS[s.key] ?? '').toLowerCase().includes(q) ||
            (SETTING_DESCRIPTIONS[s.key] ?? '').toLowerCase().includes(q),
        );
      if (matched.length > 0) acc[section] = matched;
      return acc;
    },
    {},
  );

  const totalFiltered = Object.values(filteredSections).reduce((n, arr) => n + arr.length, 0);

  return (
    <CmsDataPage
      noSelectAll={true}
      isLoading={false}
      error={undefined}
      errorMessage="Error loading settings"
      searchQuery={searchQuery}
      searchLabel="Search settings"
      onSearchChange={(e) => setSearchQuery(e.target.value)}
      totalFilteredCount={totalFiltered}
      isAllSelected={false}
      onToggleAll={() => {}}
      selectedCount={0}
    >
      {totalFiltered === 0 ? (
        <Box flex justify="center" align="center" className="py-8">
          <Text variant="body2" color="secondary">
            {searchQuery ? `No settings match "${searchQuery}"` : 'No settings found.'}
          </Text>
        </Box>
      ) : (
        <Box flex direction="col" className="gap-4">
          {Object.entries(filteredSections).map(([section, items]) => (
            <Box key={section} flex direction="col" className="gap-1.5">
              <SectionLabel label={section} />
              {items.map((setting) => {
                const isBoolean = typeof setting.value === 'boolean';
                const isDirty = dirtyKeys.has(setting.key);
                const isSaving = savingKeys.has(setting.key);
                const checked =
                  typeof localValues[setting.key] === 'boolean'
                    ? (localValues[setting.key] as boolean)
                    : false;
                const strVal =
                  typeof localValues[setting.key] === 'string'
                    ? (localValues[setting.key] as string)
                    : '';

                return (
                  <CmsItemRow
                    key={setting._id}
                    infoSlot={
                      <>
                        <Text
                          variant="body2"
                          overrideClassName="font-semibold text-sm text-primary truncate"
                        >
                          {SETTING_LABELS[setting.key] ?? setting.key}
                        </Text>
                        <Text
                          variant="caption"
                          color="secondary"
                          overrideClassName="text-xs truncate"
                        >
                          {SETTING_DESCRIPTIONS[setting.key] ?? setting.key}
                        </Text>
                      </>
                    }
                    badgesSlot={
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          setting.is_public
                            ? 'bg-success/10 text-success'
                            : 'bg-surface3 text-secondary'
                        }`}
                      >
                        {setting.is_public ? 'public' : 'private'}
                      </span>
                    }
                    actionsSlot={
                      <Box flex align="center" className="gap-3">
                        {isBoolean ? (
                          <Switch
                            color="primary"
                            size="md"
                            checked={checked}
                            onChange={(val) => handleBooleanChange(setting.key, val)}
                          />
                        ) : (
                          <SettingPickerField
                            settingKey={setting.key}
                            value={strVal}
                            onChange={(val: string) => handleStringChange(setting.key, val)}
                          />
                        )}
                        <Button
                          size="sm"
                          color="primary"
                          variant={isDirty ? 'solid' : 'outline'}
                          disabled={!isDirty || isSaving}
                          onClick={() => handleSave(setting)}
                        >
                          {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                      </Box>
                    }
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      )}
    </CmsDataPage>
  );
};

export default CmsSettingsPage;