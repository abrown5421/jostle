# games

Server-side game catalog (MongoDB) — the definitions and per-game dynamic settings schemas that sessions get configured against. Same raw-driver `Collection<T>` pattern as `@jostle/db`/`@jostle/auth`/`@jostle/notifications`/`@jostle/game-sessions` — not Mongoose.

`GameDocument._id` is the `gameId` slug itself (a plain string, not an `ObjectId`) — games are a small, curated, developer-authored catalog rather than user-generated content, so Mongo's own default `_id` uniqueness is the whole guarantee; no separate slug field or index needed, unlike every other entity in this codebase.

`validation/validate-selected-settings.ts` is pure (no MongoDB import) and whitelists: it builds the persisted settings map from only schema-defined keys, silently dropping anything else, while still failing validation for missing/invalid values on keys the schema does define.

`seed/seed-games.ts` is idempotent (per-game upsert) and meant to be called unconditionally once at API boot, not gated per-request.

Client-side UI lives in the separate `@jostle/game-catalog` package, kept apart so nothing MongoDB-touching ever ends up in a browser bundle.
