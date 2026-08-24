import { describe, expect, it } from 'vitest';
import { validateJoinFormCompletion } from './validate-join-form.js';

describe('validateJoinFormCompletion', () => {
  it('returns no errors when both fields are filled', () => {
    expect(validateJoinFormCompletion({ joinCode: 'ABC123', displayName: 'Ada' })).toEqual({});
  });

  it('flags an empty join code', () => {
    expect(validateJoinFormCompletion({ joinCode: '', displayName: 'Ada' })).toEqual({
      joinCode: 'Enter a join code.',
    });
  });

  it('flags an empty display name', () => {
    expect(validateJoinFormCompletion({ joinCode: 'ABC123', displayName: '' })).toEqual({
      displayName: 'Enter a display name.',
    });
  });

  it('flags whitespace-only input as empty', () => {
    expect(validateJoinFormCompletion({ joinCode: '   ', displayName: '   ' })).toEqual({
      joinCode: 'Enter a join code.',
      displayName: 'Enter a display name.',
    });
  });

  it('flags both fields when both are empty', () => {
    expect(validateJoinFormCompletion({ joinCode: '', displayName: '' })).toEqual({
      joinCode: 'Enter a join code.',
      displayName: 'Enter a display name.',
    });
  });
});
