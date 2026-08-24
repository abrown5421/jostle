import { getUserForSessionToken } from '@jostle/auth';
import { listNotifications, markAllNotificationsAsRead, markNotificationsAsRead } from '@jostle/notifications';
import { Router } from 'express';
import type { Request } from 'express';
import { ensureNotificationPipelineSubscription } from '../notifications/pipeline.js';
import { SESSION_COOKIE } from './auth.js';

export const notificationsRouter = Router();

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

notificationsRouter.get('/', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  ensureNotificationPipelineSubscription(userId);

  const before = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
  const result = await listNotifications({ recipientId: userId, before });
  res.json(result);
});

notificationsRouter.post('/read', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === 'string') : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array of notification ids.' });
    return;
  }

  const modifiedCount = await markNotificationsAsRead({ recipientId: userId, ids });
  res.json({ modifiedCount });
});

notificationsRouter.post('/read-all', async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const modifiedCount = await markAllNotificationsAsRead(userId);
  res.json({ modifiedCount });
});
