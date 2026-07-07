import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/token.utils.js';
import type { AccessTokenPayload } from '@inithium/types';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const cookieToken = req.cookies?.['access_token'] ?? null;

  const authHeader = req.headers['authorization'];
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const token = cookieToken ?? headerToken;

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };