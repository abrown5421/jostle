import {
  authenticate,
  createSession,
  createUser,
  deleteSession,
  EmailAlreadyInUseError,
  getUserForSessionToken,
  InvalidCredentialsError,
} from '@jostle/auth';
import { Router } from 'express';
import { assetBaseUrl } from '../media/storage.js';

export const SESSION_COOKIE = 'jostle_session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } =
    req.body ?? {};

  if (!firstName || !email || !password) {
    res
      .status(400)
      .json({ error: 'First name, email, and password are required.' });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  try {
    const user = await createUser({ firstName, lastName, email, password });
    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Signup failed', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const user = await authenticate(email, password, { assetBaseUrl });
    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error('Login failed', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await deleteSession(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const user = await getUserForSessionToken(token, { assetBaseUrl });
  if (!user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  res.json({ user });
});
