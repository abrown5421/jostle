import { notificationFeedTopic, subscribeTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { useCallback, useEffect, useReducer } from 'react';
import { selectChronological, selectUnreadCount } from '../selectors/index.js';
import { INITIAL_NOTIFICATIONS_STATE, notificationsReducer } from '../state/index.js';
import type { NotificationItem } from '../types/index.js';
import type { NotificationCenterClient } from './notification-center-client.js';

export interface UseNotificationCenterOptions {
  readonly pubsub: PubSub;
  readonly recipientId: string;
  readonly client: NotificationCenterClient;
}

export interface NotificationCenterController {
  readonly items: ReadonlyArray<NotificationItem>;
  readonly unreadCount: number;
  readonly hasMore: boolean;
  readonly loadMore: () => Promise<void>;
  readonly markAsRead: (ids: ReadonlyArray<string>) => Promise<void>;
  readonly markAllAsRead: () => Promise<void>;
}

export function useNotificationCenter(options: UseNotificationCenterOptions): NotificationCenterController {
  const { pubsub, recipientId, client } = options;
  const [state, dispatch] = useReducer(notificationsReducer, INITIAL_NOTIFICATIONS_STATE);

  useEffect(() => {
    let cancelled = false;
    client.fetchNotifications({ recipientId }).then((page) => {
      if (!cancelled) dispatch({ kind: 'received_page', items: page.items, nextCursor: page.nextCursor });
    });
    return () => {
      cancelled = true;
    };
  }, [client, recipientId]);

  useEffect(
    () =>
      subscribeTopic(pubsub, notificationFeedTopic, { recipientId }, (envelope) => {
        dispatch({ kind: 'received_live', item: envelope.payload });
      }),
    [pubsub, recipientId],
  );

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return;
    const page = await client.fetchNotifications({ recipientId, before: state.nextCursor });
    dispatch({ kind: 'received_page', items: page.items, nextCursor: page.nextCursor });
  }, [client, recipientId, state.nextCursor]);

  const markAsRead = useCallback(
    async (ids: ReadonlyArray<string>) => {
      dispatch({ kind: 'marked_read', ids });
      await client.markAsRead({ recipientId, ids });
    },
    [client, recipientId],
  );

  const markAllAsRead = useCallback(async () => {
    dispatch({ kind: 'marked_all_read' });
    await client.markAllAsRead({ recipientId });
  }, [client, recipientId]);

  return {
    items: selectChronological(state.items),
    unreadCount: selectUnreadCount(state.items),
    hasMore: state.nextCursor !== null,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
