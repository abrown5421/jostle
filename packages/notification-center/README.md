# notification-center

Client-side notification bell + drawer, built on `@jostle/messaging`'s `notificationFeedTopic` for live push. No MongoDB/server dependency — that lives in the separate `@jostle/notifications` package, so a browser bundle never touches it.

`useNotificationCenter` connects a caller-supplied REST `NotificationCenterClient` (fetch/mark-read — request/response operations) and a live pub/sub subscription (push) to a pure `notificationsReducer`; `NotificationBell` and `NotificationDrawer` are presentational only, driven entirely by props.
