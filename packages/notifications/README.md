# notifications

Server-side notification persistence (MongoDB) and the event-integration pipeline that turns inbound `@jostle/messaging` events into stored notifications. Uses the same raw-driver `Collection<T>` pattern as `@jostle/db`/`@jostle/auth` — not Mongoose, which is class/ODM-based and conflicts with this workspace's functional-only rule for business logic.

Persistence (`db/`) and the polymorphic document model (`model/`) are domain-agnostic — the `type`/`payload` fields are a generic string + `unknown`, not a closed union, so any downstream domain (friend requests, game invites, system alerts) can produce notifications without editing this package. Downstream domains hook in by registering a `NotificationFormatter` against a `@jostle/messaging` topic pattern (`pipeline/registry.ts`) — see `src/examples` for a friend-request-shaped example. `pipeline/subscribe.ts` wires those formatters to live pub/sub subscriptions and persists what they produce; `persist` is injected rather than imported directly, so the pipeline is unit-testable without a real MongoDB connection.

Client-side UI lives in the separate `@jostle/notification-center` package — kept apart so nothing MongoDB-touching ever ends up in a browser bundle.
