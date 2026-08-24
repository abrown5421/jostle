# game-sessions

Server-side persistence for host/join game lobbies (MongoDB), using the same raw-driver `Collection<T>` pattern as `@jostle/db`/`@jostle/auth`/`@jostle/notifications` — not Mongoose, which is class/ODM-based and conflicts with this workspace's functional-only rule for business logic.

Collections are named `game_sessions` / `game_session_players` — deliberately distinct from `@jostle/auth`'s `sessions` collection (login sessions), which already owns that name.

No `pipeline/` folder: unlike `@jostle/notifications`, roster events aren't derived from an external event stream — the API route handler that calls `addSessionPlayer`/`removeSessionPlayer` already knows synchronously that the mutation succeeded, and publishes directly.

Client-side UI lives in the separate `@jostle/lobby` package, kept apart so nothing MongoDB-touching ever ends up in a browser bundle.
