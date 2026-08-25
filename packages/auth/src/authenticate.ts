import { verifyPassword } from './password/index.js';
import { findUserByEmail, toPublicUser } from './users/index.js';
import type { PublicUser } from './users/index.js';

/**
 * Deliberately the same error either way (unknown email vs wrong
 * password) — a specific "no account with that email" response lets an
 * attacker enumerate registered emails.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export async function authenticate(
  email: string,
  password: string,
): Promise<PublicUser> {
  const user = await findUserByEmail(email);
  if (!user) throw new InvalidCredentialsError();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  return toPublicUser(user);
}
