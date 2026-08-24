import {
  findUserById,
  getUserForSessionToken,
  InvalidProfileInputError,
  setUserAvatarUrl,
  setUserBannerUrl,
  toPublicUser,
  updateUserProfile,
} from '@jostle/auth';
import {
  isSupportedImageMimeType,
  isValidRemoteImageUrl,
  resolveExtensionFromMimeType,
} from '@jostle/media-storage';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { assetBaseUrl, mediaStorage } from '../media/storage.js';
import { SESSION_COOKIE } from './auth.js';

export const usersRouter = Router();

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!isSupportedImageMimeType(file.mimetype)) {
      callback(
        new Error('Unsupported image type. Use PNG, JPEG, WEBP, or GIF.'),
      );
      return;
    }
    callback(null, true);
  },
});

function createSingleFileUploadMiddleware(fieldName: string) {
  const handleSingleFile = upload.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    handleSingleFile(req, res, (error: unknown) => {
      if (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to process uploaded file.';
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  };
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

usersRouter.get('/me', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ user: toPublicUser(user, { assetBaseUrl }) });
});

usersRouter.patch('/me', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const {
    firstName,
    lastName,
    bio,
    birthday,
    gender,
    customGender,
    avatarUrl,
    bannerUrl,
  } = req.body ?? {};

  if (
    avatarUrl !== undefined &&
    avatarUrl !== null &&
    !isValidRemoteImageUrl(avatarUrl)
  ) {
    res.status(400).json({ error: 'avatarUrl must be a valid http(s) URL.' });
    return;
  }
  if (
    bannerUrl !== undefined &&
    bannerUrl !== null &&
    !isValidRemoteImageUrl(bannerUrl)
  ) {
    res.status(400).json({ error: 'bannerUrl must be a valid http(s) URL.' });
    return;
  }

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

    if (avatarUrl !== undefined)
      user = await setUserAvatarUrl(userId, avatarUrl);
    if (bannerUrl !== undefined)
      user = await setUserBannerUrl(userId, bannerUrl);

    res.json({ user: user ? toPublicUser(user, { assetBaseUrl }) : null });
  } catch (error) {
    if (error instanceof InvalidProfileInputError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

usersRouter.post(
  '/me/avatar',
  createSingleFileUploadMiddleware('avatar'),
  async (req, res) => {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'An avatar image file is required.' });
      return;
    }

    const extension = resolveExtensionFromMimeType(req.file.mimetype) as string;
    const saved = await mediaStorage.saveAsset({
      userId,
      kind: 'avatar',
      buffer: req.file.buffer,
      extension,
    });

    const user = await setUserAvatarUrl(userId, saved.relativePath);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: toPublicUser(user, { assetBaseUrl }) });
  },
);

usersRouter.post(
  '/me/banner',
  createSingleFileUploadMiddleware('banner'),
  async (req, res) => {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'A banner image file is required.' });
      return;
    }

    const extension = resolveExtensionFromMimeType(req.file.mimetype) as string;
    const saved = await mediaStorage.saveAsset({
      userId,
      kind: 'banner',
      buffer: req.file.buffer,
      extension,
    });

    const user = await setUserBannerUrl(userId, saved.relativePath);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: toPublicUser(user, { assetBaseUrl }) });
  },
);
