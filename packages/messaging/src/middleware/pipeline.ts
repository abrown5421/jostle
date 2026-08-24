import type { MessageEnvelope } from '../envelope/index.js';
import type { Middleware } from './types.js';

export function composeMiddleware(middlewares: ReadonlyArray<Middleware>): Middleware {
  return (envelope, next) => {
    const dispatch = (index: number, current: MessageEnvelope): Promise<void> => {
      const middleware = middlewares[index];
      return middleware ? middleware(current, (nextEnvelope) => dispatch(index + 1, nextEnvelope)) : next(current);
    };
    return dispatch(0, envelope);
  };
}
