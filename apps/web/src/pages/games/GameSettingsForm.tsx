import { useEffect, useState, type ReactNode } from 'react';
import { Box, Select, SelectItem, Slider, Switch, Text } from '@inithium/ui';
import type { GameSettingDefinition, GameSettingValue, GameSettingValues } from '@inithium/api-client';
import { formatSettingValue } from './gameLabels';
import { IntegrationResourceSetting } from './settingControls/IntegrationResourceSetting';
import { SURFACE_TEXT } from './surfaceColors';

export interface GameSettingsFormProps {
  readonly definitions: readonly GameSettingDefinition[];
  // The session's current values - the server's, not a local copy. Every change round-trips
  // through host:update-game-settings and comes back as a new snapshot.
  readonly values: GameSettingValues;
  readonly onChange: (patch: GameSettingValues) => void;
  readonly disabled?: boolean;
}

type NumberSettingDefinition = Extract<GameSettingDefinition, { type: 'number' }>;

// A setting's description is rendered here rather than through the controls' own helperText,
// which FieldShell paints in a light surface-300 meant for dark panels - unreadable on the
// surface-100 settings panel.
const SettingField = ({ description, children }: { description?: string; children: ReactNode }) => (
  <Box flex={{ direction: 'col', gap: 4 }}>
    {children}
    {description && (
      <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
        {description}
      </Text>
    )}
  </Box>
);

// Shows the thumb's position while dragging, but only sends on release - one message per change
// rather than one per pixel. The draft clears once the server's value moves (ours confirmed, or
// someone else's change), so the slider never fights the snapshot.
const NumberSetting = ({
  definition,
  value,
  disabled,
  onCommit,
}: {
  definition: NumberSettingDefinition;
  value: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
}) => {
  const [draft, setDraft] = useState<number | null>(null);
  useEffect(() => setDraft(null), [value]);
  const shown = draft ?? value;

  return (
    <Slider
      label={`${definition.label}: ${formatSettingValue(definition, shown)}`}
      value={[shown]}
      min={definition.min}
      max={definition.max}
      step={definition.step ?? 1}
      disabled={disabled}
      onValueChange={([next]) => setDraft(next)}
      onValueCommit={([next]) => {
        if (next !== value) onCommit(next);
      }}
    />
  );
};

// Renders whatever settings a game's catalogue record declares, one control per setting type - a
// new game's settings screen is just data. A game wanting a bespoke control adds a new setting
// type here (and to the server-side validator), not a per-game form.
export const GameSettingsForm = ({ definitions, values, onChange, disabled }: GameSettingsFormProps) => {
  const valueOf = (definition: GameSettingDefinition): GameSettingValue => values[definition.key] ?? definition.default;
  const change = (key: string, value: GameSettingValue) => onChange({ [key]: value });

  return (
    <Box flex={{ direction: 'col', gap: 24 }} className="w-full">
      {definitions.map((definition) => (
        <SettingField key={definition.key} description={definition.description}>
          {definition.type === 'number' ? (
            <NumberSetting
              definition={definition}
              value={Number(valueOf(definition))}
              disabled={disabled}
              onCommit={(value) => change(definition.key, value)}
            />
          ) : definition.type === 'integration-resource' ? (
            <IntegrationResourceSetting
              definition={definition}
              value={String(valueOf(definition))}
              values={values}
              disabled={disabled}
              onChange={(value) => change(definition.key, value)}
            />
          ) : definition.type === 'boolean' ? (
            <Switch
              label={definition.label}
              checked={Boolean(valueOf(definition))}
              disabled={disabled}
              onCheckedChange={(checked) => change(definition.key, checked)}
            />
          ) : (
            <Select
              label={definition.label}
              value={String(valueOf(definition))}
              disabled={disabled}
              onValueChange={(value) => change(definition.key, value)}
            >
              {definition.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
        </SettingField>
      ))}
    </Box>
  );
};
