import { Input, Select, Slider, Switch } from '@jostle/ui';
import type { DynamicSettingFieldDefinition } from './types.js';

export interface ConfigurationFieldProps {
  readonly field: DynamicSettingFieldDefinition;
  readonly value: string | number | boolean;
  readonly setValue: (value: string | number | boolean) => void;
}

export function ConfigurationField({ field, value, setValue }: ConfigurationFieldProps) {
  if (field.type === 'number') {
    return (
      <Slider
        label={field.label}
        value={typeof value === 'number' ? value : Number(field.defaultValue)}
        setValue={setValue}
        min={field.min}
        max={field.max}
        step={field.step}
      />
    );
  }

  if (field.type === 'boolean') {
    return <Switch label={field.label} value={typeof value === 'boolean' ? value : Boolean(field.defaultValue)} setValue={setValue} />;
  }

  if (field.type === 'select') {
    return (
      <Select
        label={field.label}
        value={typeof value === 'string' ? value : String(field.defaultValue)}
        setValue={setValue}
        options={field.options ? [...field.options] : []}
      />
    );
  }

  return <Input label={field.label} value={typeof value === 'string' ? value : String(field.defaultValue)} setValue={setValue} />;
}
