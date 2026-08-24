import { describe, expect, it } from 'vitest';
import { mergeServerError } from './merge-server-error.js';

describe('mergeServerError', () => {
  it('adds the server error onto an existing errors object', () => {
    expect(mergeServerError({ joinCode: 'Enter a join code.' }, { field: 'displayName', message: 'Taken' })).toEqual({
      joinCode: 'Enter a join code.',
      displayName: 'Taken',
    });
  });

  it('overwrites an existing error for the same field', () => {
    expect(mergeServerError({ displayName: 'old' }, { field: 'displayName', message: 'new' })).toEqual({
      displayName: 'new',
    });
  });

  it('does not mutate the input errors object', () => {
    const errors = { joinCode: 'x' };
    mergeServerError(errors, { field: 'displayName', message: 'y' });
    expect(errors).toEqual({ joinCode: 'x' });
  });
});
