import type { DynamicSettingFieldDefinition, SelectedSettingsMap } from './types.js';

export function validateSelectedSettingsCompletion(
  schema: ReadonlyArray<DynamicSettingFieldDefinition>,
  values: SelectedSettingsMap
): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};

  for (const field of schema) {
    const value = values[field.key];
    if (value === undefined) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (field.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
      errors[field.key] = `${field.label} must be a number.`;
    } else if (field.type === 'number' && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) errors[field.key] = `${field.label} must be at least ${field.min}.`;
      if (field.max !== undefined && value > field.max) errors[field.key] = `${field.label} must be at most ${field.max}.`;
    } else if (field.type === 'boolean' && typeof value !== 'boolean') {
      errors[field.key] = `${field.label} must be true or false.`;
    } else if (field.type === 'select') {
      const validValues = field.options?.map((option) => option.value) ?? [];
      if (typeof value !== 'string' || !validValues.includes(value)) {
        errors[field.key] = `${field.label} must be one of the provided options.`;
      }
    } else if (field.type === 'string' && typeof value !== 'string') {
      errors[field.key] = `${field.label} must be text.`;
    }
  }

  return errors;
}
