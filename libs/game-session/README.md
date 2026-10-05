# game-session

Jostle's host → join session layer: session lifecycle, participant seats, and the
`/realtime/session` WebSocket gateway. Built on `@inithium/realtime`'s provider pub/sub, so all
fan-out scales with whichever `RealtimeProvider` is active.

## Flow

1. **Host** (authenticated) — `POST /api/game-sessions` → `{ hostToken, session }`. Get-or-create:
   a host has at most one live session and calling this again returns it. The host is **not** a
   participant. `GET /api/game-sessions/mine` returns that session (or `null`) without creating one.
2. **Player** (guest or authenticated) — `POST /api/game-sessions/:code/join` with `{ name }` →
   `{ participantId, playerToken, session }`.
3. Both open `ws(s)://<api>/realtime/session?token=<hostToken|playerToken>`. The first frame is
   always `{ type: 'welcome', role, participantId, session }`; after that, `session:updated`
   events carry a full `SessionSnapshot` on every change.
4. **Game selection** (host only, while in `lobby` - players can keep joining throughout):
   - `{ type: 'host:select-game', gameId }` - picks a game from the catalogue; `snapshot.selection`
     becomes `{ gameId, settings }` with the game's default settings. Re-picking the same game
     keeps its settings.
   - `{ type: 'host:update-game-settings', settings }` - a partial patch, validated against the
     game's catalogue setting definitions (type, range, step, options). Any bad key or value
     rejects the whole patch with `INVALID_SETTINGS`.
   - `{ type: 'host:clear-game' }` - back to no selection.
   - `{ type: 'host:start-game' }` - starts the selected game: checks the catalogue's
     `minPlayers`/`maxPlayers`, that a `GameDefinition` exists (`GAME_NOT_PLAYABLE` otherwise),
     then the definition's own `validateSettings`.

## Channels (all via the realtime provider)

| Channel                                | Audience               |
| -------------------------------------- | ---------------------- |
| `session:<code>`                       | host + every player    |
| `session:<code>:host`                  | host screen(s)         |
| `session:<code>:participant:<id>`      | one player's device(s) |

The `session:` prefix is blocked on the general `/realtime` gateway (see `apps/api/src/main.ts`).

## Lifecycle rules

- Sessions live in memory (`memorySessionStore`); swap via `setGameSessionStore` for multi-process.
- No host screen connected for `HOST_RECONNECT_GRACE_MS` (2 min) → session ends.
- Joins are accepted only in `lobby`, up to `MAX_PARTICIPANTS` (50, a session-wide ceiling that is never sent to clients — the lobby reads as unlimited), names unique (case-insensitive).
  Per-game player counts are the game catalogue record's `minPlayers`/`maxPlayers`, checked at game start.
- A disconnected player keeps their seat; their token rejoins it.

## Web host flow

The host side spans three pages that share one *retained* host socket (`retainGameSession` in
`@inithium/api-client`, via `apps/web`'s `useHostSession`), so navigating between them never drops
the connection and starts the host-absence countdown:

- Hosted first: `/host` (players join) -> `/games` (Select) -> `/settings/:code` -> start.
- Picked a game first: `/games` (Host) -> `/host?game=<slug>` (players join) -> `/settings/:code` -> start.

## The game catalogue

Which games exist, and everything descriptive about them (title, art, rules, player counts, and
the *shape* of their settings), is a game catalogue record - `@inithium/db`'s `GameEntity`, the
`games` collection. This lib reads it through an injected `GameCatalog` (`setGameCatalog`, wired
to the database in `apps/api/src/main.ts`), so it never imports a database driver itself.

## Adding a game

1. **Catalogue it** - add `libs/db/src/game-seeds/<slug>.game-seed.ts` and list it in that folder's
   `registry.ts`. It's seeded on the next API boot (once - later seed edits don't overwrite an
   existing record). Settings are declared as data (`number` / `boolean` / `select`), and the
   host's settings screen and the server-side validation both follow from that. At this point the
   game shows on `/games` and can be selected and configured, but not started.
2. **Make it playable** - implement `GameDefinition` (pure, server-authoritative reducer +
   public/private views) with `id` equal to the slug, and add it to `src/games/registry.ts`.
   `createInitialState` receives the host's validated settings; put cross-setting or
   session-dependent rules (e.g. "at least two players per team") in `validateSettings`. Players
   send `{ type: 'game:action', action }`. No transport changes needed.
