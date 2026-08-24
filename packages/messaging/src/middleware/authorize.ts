import type { MessageEnvelope } from '../envelope/index.js';
import type { Middleware } from './types.js';

export type Authorizer = (envelope: MessageEnvelope) => boolean | Promise<boolean>;

export function createAuthorizationMiddleware(authorize: Authorizer): Middleware {
  return async (envelope, next) => {
    if (await authorize(envelope)) {
      await next(envelope);
    }
  };
}
