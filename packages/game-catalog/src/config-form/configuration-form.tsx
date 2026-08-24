import { Button } from '@jostle/ui';
import { useState } from 'react';
import { ConfigurationField } from './configuration-field.js';
import { deriveInitialValues } from './derive-initial-values.js';
import type { DynamicSettingFieldDefinition, SelectedSettingsMap } from './types.js';

export interface ConfigurationFormProps {
  readonly schema: ReadonlyArray<DynamicSettingFieldDefinition>;
  readonly initialValues?: SelectedSettingsMap;
  readonly onSave: (values: SelectedSettingsMap) => Promise<void>;
}

export function ConfigurationForm({ schema, initialValues, onSave }: ConfigurationFormProps) {
  const [values, setValues] = useState<SelectedSettingsMap>(() => initialValues ?? deriveInitialValues(schema));
  const [isSaving, setIsSaving] = useState(false);

  const setFieldValue = (key: string, value: string | number | boolean): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await onSave(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {schema.map((field) => (
        <ConfigurationField
          key={field.key}
          field={field}
          value={values[field.key] ?? field.defaultValue}
          setValue={(value) => setFieldValue(field.key, value)}
        />
      ))}
      <Button color="primary" onClick={handleSave} disabled={isSaving} className="mt-2 w-full">
        {isSaving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
}
