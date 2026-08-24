import type { DynamicSettingFieldDefinition } from '../model/index.js';

export interface SelectedSettingsError {
  readonly key: string;
  readonly message: string;
}

export interface ValidateSelectedSettingsResult {
  readonly valid: boolean;
  readonly sanitizedSettings: Readonly<Record<string, string | number | boolean>>;
  readonly errors: ReadonlyArray<SelectedSettingsError>;
}

function validateField(
  field: DynamicSettingFieldDefinition,
  value: unknown
): { readonly value: string | number | boolean | undefined; readonly error: SelectedSettingsError | undefined } {
  if (value === undefined) {
    return { value: undefined, error: { key: field.key, message: `${field.label} is required.` } };
  }

  if (field.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { value: undefined, error: { key: field.key, message: `${field.label} must be a number.` } };
    }
    if (field.min !== undefined && value < field.min) {
      return { value: undefined, error: { key: field.key, message: `${field.label} must be at least ${field.min}.` } };
    }
    if (field.max !== undefined && value > field.max) {
      return { value: undefined, error: { key: field.key, message: `${field.label} must be at most ${field.max}.` } };
    }
    return { value, error: undefined };
  }

  if (field.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { value: undefined, error: { key: field.key, message: `${field.label} must be true or false.` } };
    }
    return { value, error: undefined };
  }

  if (field.type === 'select') {
    const validValues = field.options?.map((option) => option.value) ?? [];
    if (typeof value !== 'string' || !validValues.includes(value)) {
      return { value: undefined, error: { key: field.key, message: `${field.label} must be one of the provided options.` } };
    }
    return { value, error: undefined };
  }

  if (typeof value !== 'string') {
    return { value: undefined, error: { key: field.key, message: `${field.label} must be text.` } };
  }
  return { value, error: undefined };
}

export function validateSelectedSettings(
  schema: ReadonlyArray<DynamicSettingFieldDefinition>,
  input: Record<string, unknown>
): ValidateSelectedSettingsResult {
  const errors: SelectedSettingsError[] = [];
  const sanitizedSettings: Record<string, string | number | boolean> = {};

  for (const field of schema) {
    const { value, error } = validateField(field, input[field.key]);
    if (error) {
      errors.push(error);
    } else if (value !== undefined) {
      sanitizedSettings[field.key] = value;
    }
  }

  return { valid: errors.length === 0, sanitizedSettings, errors };
}
