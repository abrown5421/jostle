import type { GameSettingDefinition, GameSettingValue } from '@inithium/api-client';

export const formatPlayerCount = ({ minPlayers, maxPlayers }: { minPlayers: number; maxPlayers: number }): string =>
  minPlayers === maxPlayers ? `${minPlayers} players` : `${minPlayers}–${maxPlayers} players`;

// "20 seconds", "On", "Normal" - how a setting's value reads in summaries and slider labels.
export const formatSettingValue = (definition: GameSettingDefinition, value: GameSettingValue): string => {
  switch (definition.type) {
    case 'number':
      return definition.unit ? `${value} ${definition.unit}` : String(value);
    case 'boolean':
      return value ? 'On' : 'Off';
    case 'select':
      return definition.options.find((option) => option.value === value)?.label ?? String(value);
    case 'integration-resource':
      // Only an opaque id is stored - the picker shows the resource itself.
      return value ? 'Chosen' : 'Not chosen';
  }
};
