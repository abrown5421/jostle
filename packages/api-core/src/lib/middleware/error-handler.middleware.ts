import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export interface ErrorLogPayload {
  message: string;
  stack?: string;
  method?: string;
  url?: string;
  statusCode: number;
  userContext?: string;
}

export const createErrorHandler = (
  onLog?: (payload: ErrorLogPayload) => Promise<void> | void
): ErrorRequestHandler => {
  return async (err: any, req: Request, res: Response, next: NextFunction): Promise<void> => {
    const statusCode = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? 'Internal Server Error';

    if (onLog) {
      try {
        await onLog({
          message,
          stack: err.stack,
          method: req.method,
          url: req.originalUrl,
          statusCode,
          userContext: req.user?.sub ? String(req.user.sub) : undefined,
        });
      } catch (loggingError) {
        console.error('Core Error Logger Delegate Failed:', loggingError);
      }
    }

    res.status(statusCode).json({
      message: process.env['NODE_ENV'] === 'production' ? 'An unexpected error occurred' : message,
      ...(process.env['NODE_ENV'] !== 'production' && { stack: err.stack }),
    });
  };
};