import type { GameSettingDefinition, GameSettingValue, GameSettingValues } from '@inithium/db';
import { GameSessionError } from './session.errors';

// Generic, data-driven validation for every game's settings: the catalogue record declares each
// setting's type and constraints, and these functions enforce them - so a new game's settings
// need no new validation code. Settings that depend on each other or on the session (e.g. more
// teams than players) are a GameDefinition's validateSettings, checked at game start.

const STEP_EPSILON = 1e-9;

const invalid = (message: string): GameSessionError => new GameSessionError('INVALID_SETTINGS', message);

const isOnStep = (value: number, min: number, step: number): boolean => {
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < STEP_EPSILON;
};

const validateSettingValue = (definition: GameSettingDefinition, value: unknown): GameSettingValue => {
  switch (definition.type) {
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${definition.label} must be a number`);
      if (value < definition.min || value > definition.max) {
        throw invalid(`${definition.label} must be between ${definition.min} and ${definition.max}`);
      }
      const step = definition.step ?? 1;
      if (!isOnStep(value, definition.min, step)) {
        throw invalid(`${definition.label} must go up in steps of ${step}`);
      }
      return value;
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw invalid(`${definition.label} must be on or off`);
      return value;
    case 'select':
      if (typeof value !== 'string' || !definition.options.some((option) => option.value === value)) {
        throw invalid(`${definition.label} must be one of: ${definition.options.map((option) => option.label).join(', ')}`);
      }
      return value;
  }
};

export const defaultGameSettings = (definitions: readonly GameSettingDefinition[]): GameSettingValues =>
  Object.fromEntries(definitions.map((definition) => [definition.key, definition.default]));

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Applies a host's partial change on top of `current`. Strict: an unknown key or a bad value
// rejects the whole patch, so the stored settings are always a complete, valid set.
export const applyGameSettingsPatch = (
  definitions: readonly GameSettingDefinition[],
  current: GameSettingValues,
  patch: unknown,
): GameSettingValues => {
  if (!isPlainObject(patch)) throw invalid('Settings must be an object');
  const next: GameSettingValues = { ...current };
  Object.entries(patch).forEach(([key, value]) => {
    const definition = definitions.find((candidate) => candidate.key === key);
    if (!definition) throw invalid(`Unknown setting "${key}"`);
    next[key] = validateSettingValue(definition, value);
  });
  return next;
};

// Lenient counterpart for settings that were valid when chosen but may predate an edit to the
// catalogue record: keys the game no longer declares are dropped, newly declared keys get their
// defaults, and every surviving value is re-validated against today's constraints.
export const resolveGameSettings = (
  definitions: readonly GameSettingDefinition[],
  stored: GameSettingValues,
): GameSettingValues => {
  const known = Object.fromEntries(
    Object.entries(stored).filter(([key]) => definitions.some((definition) => definition.key === key)),
  );
  return applyGameSettingsPatch(definitions, defaultGameSettings(definitions), known);
};

// Checks a catalogue record's own setting definitions are coherent (unique keys, sane ranges,
// defaults that would pass validation). Not on any request path - for seed tests and any future
// catalogue editor, so a bad record is caught before a host ever trips over it.
export const assertValidGameSettingDefinitions = (definitions: readonly GameSettingDefinition[]): void => {
  const keys = new Set<string>();
  definitions.forEach((definition) => {
    if (keys.has(definition.key)) throw invalid(`Duplicate setting key "${definition.key}"`);
    keys.add(definition.key);
    if (definition.type === 'number') {
      if (definition.min > definition.max) throw invalid(`${definition.label}: min is greater than max`);
      if (definition.step !== undefined && definition.step <= 0) throw invalid(`${definition.label}: step must be positive`);
    }
    if (definition.type === 'select' && definition.options.length === 0) {
      throw invalid(`${definition.label}: a select needs at least one option`);
    }
    validateSettingValue(definition, definition.default);
  });
};
