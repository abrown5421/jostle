import type { NotificationItem } from '../types/index.js';

export interface NotificationsState {
  readonly items: ReadonlyArray<NotificationItem>;
  readonly nextCursor: string | null;
}

export type NotificationsAction =
  | { readonly kind: 'received_page'; readonly items: ReadonlyArray<NotificationItem>; readonly nextCursor: string | null }
  | { readonly kind: 'received_live'; readonly item: NotificationItem }
  | { readonly kind: 'marked_read'; readonly ids: ReadonlyArray<string> }
  | { readonly kind: 'marked_all_read' };

export const INITIAL_NOTIFICATIONS_STATE: NotificationsState = { items: [], nextCursor: null };

export function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.kind) {
    case 'received_page':
      return { items: [...state.items, ...action.items], nextCursor: action.nextCursor };
    case 'received_live':
      return { items: [action.item, ...state.items], nextCursor: state.nextCursor };
    case 'marked_read':
      return {
        ...state,
        items: state.items.map((item) => (action.ids.includes(item.id) ? { ...item, readStatus: true } : item)),
      };
    case 'marked_all_read':
      return { ...state, items: state.items.map((item) => ({ ...item, readStatus: true })) };
    default:
      return state;
  }
}
