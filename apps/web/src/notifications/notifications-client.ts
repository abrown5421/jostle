import type { NotificationCenterClient } from '@jostle/notification-center';

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

export const notificationsClient: NotificationCenterClient = {
  async fetchNotifications({ before }) {
    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    return (await getJson(`/notifications${query}`)) as Awaited<ReturnType<NotificationCenterClient['fetchNotifications']>>;
  },

  async markAsRead({ ids }) {
    await postJson('/notifications/read', { ids });
  },

  async markAllAsRead() {
    await postJson('/notifications/read-all', {});
  },
};
