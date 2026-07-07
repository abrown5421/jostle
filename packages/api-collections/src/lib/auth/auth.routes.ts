import { Router, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import rateLimit from 'express-rate-limit';
import { authService } from './auth.service.js';
import { LoginSchema, SignupSchema } from './auth.validators.js';
import { UserModel } from '../users/users.model.js';

const COOKIE_OPTS = {
  httpOnly:  true,
  secure:    process.env['NODE_ENV'] === 'production',
  sameSite:  process.env['NODE_ENV'] === 'production' ? 'none' as const : 'lax' as const,
  path:      '/',
};

const ACCESS_COOKIE_TTL  = 15 * 60 * 1000;
const REFRESH_COOKIE_TTL = 3 * 24 * 60 * 60 * 1000;

const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_COOKIE_TTL,
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_COOKIE_TTL,
    path:   '/api/auth/refresh',
  });
};

const clearTokenCookies = (res: Response) => {
  res.clearCookie('access_token',  { ...COOKIE_OPTS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTS, path: '/api/auth/refresh' });
};

const authRateLimit = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many requests, please try again later.' },
});

const loginRateLimit = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many login attempts, please try again later.' },
});

export const authRouter: Router = Router();

authRouter.post(
  '/signup',
  authRateLimit,
  validate(SignupSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.signup(req.body);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json({ message: 'Account created' });
  })
);

authRouter.post(
  '/login',
  loginRateLimit,
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.login(req.body);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(200).json({ message: 'Logged in' });
  })
);

authRouter.post(
  '/refresh',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }
    const tokens = await authService.refresh(refreshToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(200).json({ message: 'Refreshed' });
  })
);

authRouter.post('/logout', (_req, res) => {
  clearTokenCookies(res);
  res.status(200).json({ message: 'Logged out' });
});

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.['access_token'];
    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { verifyAccessToken } = await import('@inithium/api-core');
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).lean().exec();
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  })
);