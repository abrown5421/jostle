import type { DynamicSettingFieldDefinition, SelectedSettingsMap } from './types.js';

export function deriveInitialValues(schema: ReadonlyArray<DynamicSettingFieldDefinition>): SelectedSettingsMap {
  const values: Record<string, string | number | boolean> = {};
  for (const field of schema) {
    values[field.key] = field.defaultValue;
  }
  return values;
}
