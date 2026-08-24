import type { JoinFormErrors, JoinFormFields } from './types.js';

export function validateJoinFormCompletion(fields: JoinFormFields): JoinFormErrors {
  const joinCode = fields.joinCode.trim();
  const displayName = fields.displayName.trim();

  return {
    ...(joinCode.length === 0 ? { joinCode: 'Enter a join code.' } : {}),
    ...(displayName.length === 0 ? { displayName: 'Enter a display name.' } : {}),
  };
}
