import { describe, expect, it } from 'vitest';
import { validateSelectedSettings } from './validate-selected-settings.js';
import type { DynamicSettingFieldDefinition } from '../model/index.js';

const NUMBER_FIELD: DynamicSettingFieldDefinition = {
  key: 'songBankSize',
  label: 'Song Bank Size',
  type: 'number',
  defaultValue: 20,
  min: 5,
  max: 100,
  step: 1,
};

const BOOLEAN_FIELD: DynamicSettingFieldDefinition = {
  key: 'enableArtistGuess',
  label: 'Enable Artist Guess',
  type: 'boolean',
  defaultValue: true,
};

const SELECT_FIELD: DynamicSettingFieldDefinition = {
  key: 'difficulty',
  label: 'Difficulty',
  type: 'select',
  defaultValue: 'medium',
  options: [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ],
};

const STRING_FIELD: DynamicSettingFieldDefinition = {
  key: 'playlistSourceUrl',
  label: 'Playlist Source URL',
  type: 'string',
  defaultValue: '',
};

describe('validateSelectedSettings', () => {
  it('accepts a fully valid input and returns it as sanitizedSettings', () => {
    const result = validateSelectedSettings([NUMBER_FIELD, BOOLEAN_FIELD], { songBankSize: 40, enableArtistGuess: false });
    expect(result).toEqual({
      valid: true,
      sanitizedSettings: { songBankSize: 40, enableArtistGuess: false },
      errors: [],
    });
  });

  it('flags a missing required key', () => {
    const result = validateSelectedSettings([NUMBER_FIELD], {});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([{ key: 'songBankSize', message: 'Song Bank Size is required.' }]);
  });

  it('flags a number field given a non-number', () => {
    const result = validateSelectedSettings([NUMBER_FIELD], { songBankSize: 'forty' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.key).toBe('songBankSize');
  });

  it('flags a number below min', () => {
    const result = validateSelectedSettings([NUMBER_FIELD], { songBankSize: 1 });
    expect(result.errors).toEqual([{ key: 'songBankSize', message: 'Song Bank Size must be at least 5.' }]);
  });

  it('flags a number above max', () => {
    const result = validateSelectedSettings([NUMBER_FIELD], { songBankSize: 500 });
    expect(result.errors).toEqual([{ key: 'songBankSize', message: 'Song Bank Size must be at most 100.' }]);
  });

  it('flags a boolean field given a non-boolean', () => {
    const result = validateSelectedSettings([BOOLEAN_FIELD], { enableArtistGuess: 'yes' });
    expect(result.valid).toBe(false);
  });

  it('flags a select field given a value not in options', () => {
    const result = validateSelectedSettings([SELECT_FIELD], { difficulty: 'impossible' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain('must be one of the provided options');
  });

  it('accepts a select field given a valid option value', () => {
    const result = validateSelectedSettings([SELECT_FIELD], { difficulty: 'hard' });
    expect(result.valid).toBe(true);
    expect(result.sanitizedSettings).toEqual({ difficulty: 'hard' });
  });

  it('flags a string field given a non-string', () => {
    const result = validateSelectedSettings([STRING_FIELD], { playlistSourceUrl: 123 });
    expect(result.valid).toBe(false);
  });

  it('silently drops keys not present in the schema', () => {
    const result = validateSelectedSettings([NUMBER_FIELD], { songBankSize: 30, notAKnownKey: 'x' });
    expect(result.valid).toBe(true);
    expect(result.sanitizedSettings).toEqual({ songBankSize: 30 });
    expect(result.sanitizedSettings).not.toHaveProperty('notAKnownKey');
  });

  it('validates every field in a multi-field schema independently, collecting all errors', () => {
    const result = validateSelectedSettings([NUMBER_FIELD, BOOLEAN_FIELD], { songBankSize: 1000, enableArtistGuess: 'nope' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
