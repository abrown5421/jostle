import type { JoinFormErrors } from './types.js';

export interface ServerFieldError {
  readonly field: 'joinCode' | 'displayName';
  readonly message: string;
}

export function mergeServerError(errors: JoinFormErrors, serverError: ServerFieldError): JoinFormErrors {
  return { ...errors, [serverError.field]: serverError.message };
}
