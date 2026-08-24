import { describe, expect, it } from 'vitest';
import { validateSelectedSettingsCompletion } from './validate-selected-settings-completion.js';
import type { DynamicSettingFieldDefinition } from './types.js';

const NUMBER_FIELD: DynamicSettingFieldDefinition = {
  key: 'songBankSize',
  label: 'Song Bank Size',
  type: 'number',
  defaultValue: 20,
  min: 5,
  max: 100,
};

describe('validateSelectedSettingsCompletion', () => {
  it('returns no errors for a fully valid map', () => {
    expect(validateSelectedSettingsCompletion([NUMBER_FIELD], { songBankSize: 40 })).toEqual({});
  });

  it('flags a missing value', () => {
    expect(validateSelectedSettingsCompletion([NUMBER_FIELD], {})).toEqual({
      songBankSize: 'Song Bank Size is required.',
    });
  });

  it('flags a number below min', () => {
    expect(validateSelectedSettingsCompletion([NUMBER_FIELD], { songBankSize: 1 })).toEqual({
      songBankSize: 'Song Bank Size must be at least 5.',
    });
  });

  it('flags a number above max', () => {
    expect(validateSelectedSettingsCompletion([NUMBER_FIELD], { songBankSize: 1000 })).toEqual({
      songBankSize: 'Song Bank Size must be at most 100.',
    });
  });
});
