import {
  findUserById,
  getUserForSessionToken,
  InvalidProfileInputError,
  isProfileOwner,
  setUserAvatar,
  setUserBannerConfig,
  toPublicProfileView,
  toPublicUser,
  updateUserProfile,
} from '@jostle/auth';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { SESSION_COOKIE } from './auth.js';

export const usersRouter = Router();

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

function requireProfileOwner(
  activeUserId: string | null,
  targetUserId: string,
  res: Response,
): boolean {
  if (!activeUserId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return false;
  }
  if (!isProfileOwner(activeUserId, targetUserId)) {
    res.status(403).json({ error: 'You can only modify your own profile.' });
    return false;
  }
  return true;
}

usersRouter.get('/:userId', async (req, res) => {
  const userId = req.params.userId as string;
  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const viewerUserId = await getAuthenticatedUserId(req);
  const publicUser = toPublicUser(user);
  const payload = isProfileOwner(viewerUserId, userId)
    ? publicUser
    : toPublicProfileView(publicUser);

  res.json({ user: payload });
});

usersRouter.patch('/:userId', async (req, res) => {
  const userId = req.params.userId as string;
  const activeUserId = await getAuthenticatedUserId(req);
  if (!requireProfileOwner(activeUserId, userId, res)) return;

  const {
    firstName,
    lastName,
    bio,
    birthday,
    gender,
    customGender,
    avatarSeed,
    avatarStyle,
    bannerConfig,
  } = req.body ?? {};

  try {
    let user = await updateUserProfile(userId, {
      firstName,
      lastName,
      bio,
      birthday,
      gender,
      customGender,
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (avatarSeed !== undefined) {
      user = await setUserAvatar(
        userId,
        avatarSeed === null ? null : { seed: avatarSeed, style: avatarStyle },
      );
    }
    if (bannerConfig !== undefined)
      user = await setUserBannerConfig(userId, bannerConfig);

    res.json({ user: user ? toPublicUser(user) : null });
  } catch (error) {
    if (error instanceof InvalidProfileInputError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});
