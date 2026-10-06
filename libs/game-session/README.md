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
     the host's requirements (`REQUIREMENTS_NOT_MET`), required settings (`SETTING_REQUIRED`),
     then the definition's own `validateSettings` and async `prepare` (see below).
5. **In game** - everyone sends `{ type: 'game:action', action }`. Every change re-broadcasts the
   snapshot (with the game's `publicView`), each player's `privateView` (`game:private`) and the
   host's `hostView` (`game:host`). A reconnecting socket gets its seat's view in its `welcome`
   (`gameView`). Snapshots carry `serverTime` so clients can count down to server deadlines.

## Channels (all via the realtime provider)

| Channel                                | Audience               |
| -------------------------------------- | ---------------------- |
| `session:<code>`                       | host + every player    |
| `session:<code>:host`                  | host screen(s)         |
| `session:<code>:participant:<id>`      | one player's device(s) |

Game views: `publicView` rides on `session:updated` (everyone), `hostView` on `game:host` (host
channel), `privateView` on `game:private` (each participant's channel). Anything a player must not
see yet (the answer, the song to play) belongs in `hostView` or `privateView` only.

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
   `registry.ts`. It's seeded on the next API boot; bump its `seedVersion` to push later edits to
   databases that already have it. Settings are declared as data (`number` / `boolean` / `select` /
   `integration-resource`), and the
   host's settings screen and the server-side validation both follow from that. At this point the
   game shows on `/games` and can be selected and configured, but not started.
2. **Make it playable** - implement `GameDefinition` (pure, server-authoritative reducer +
   public/private views) with `id` equal to the slug, and add it to `src/games/registry.ts`.
   `createInitialState` receives the host's validated settings; put cross-setting or
   session-dependent rules (e.g. "at least two players per team") in `validateSettings`. Players
   send `{ type: 'game:action', action }`. No transport changes needed. Optional extras:
   - `prepare(context)` - async, network-allowed setup run before `createInitialState` (which
     receives its result). Runs *outside* the session lock with a timeout
     (`GAME_PREPARE_TIMEOUT_MS`); the start is re-validated afterwards. Reach external services
     through a port wired in by `apps/api` (`libs/api-core/src/games/configureGameRuntime.ts`:
     iPod War's `setIpodWarMusicSource`, Wordle War's Datamuse-backed
     `setWordleWarDictionarySource`), never by importing them.
   - `nextTimeout(state)` - the game's next timed event, derived from state. The service keeps
     one timer per session armed from it and dispatches its action as `role: 'system'`. Return
     null while paused. Tag timer actions (e.g. a sequence number) and ignore stale ones.
   - `hostView(state)` - what only the host screen sees.
   - `privateView(state, participantId)` - what one player alone sees. A secret one player holds
     for the room (Fishbowl's presenter and their current clue) belongs here, never in
     `publicView` - the host screen is in front of everyone.
   - React to `SYSTEM_ACTIONS` (`system:participants-changed`, `system:host-connection`). Clients
     can never send `system:*` actions.
   - Return `silent: true` from `handleAction` for a change no screen needs to see (Point of Hue's
     streamed picker colors): it's stored without broadcasting. Score deltas and completion always
     broadcast.
   - A timed, round-based game (iPod War, Point of Hue) builds on `src/games/shared`: the
     `TimedPhaseState` fields plus `enterTimedPhase` / `pausePhase` / `resumePhase` /
     `phaseTimeout` (its `nextTimeout`) / `isCurrentTimer` for phase timing, and `toStandings` /
     `everyConnectedRosterMember` / `pruneRoster` for its roster. Its web screens likewise reuse
     `apps/web/src/games/shared/stage.tsx` (header + host controls, lock-in grid, leaderboard rows,
     final results).
3. **Host requirements** (optional) - list them on the catalogue record's `requirements` (e.g.
   `{ kind: 'integration', provider: 'spotify', capabilities: ['playback'] }`). They're
   evaluated per user by the injected `GameRequirementEvaluator` (`setGameRequirementEvaluator`)
   on pick and start, and surfaced per user as `hostBlockers` on `GET /api/games`.
4. **Its screens** - `apps/web/src/games/<slug>/index.ts` default-exporting a `WebGameModule`
   (`HostStage`, `PlayerController`, optional `useHostSetup`). `/host` and `/play/:code` render
   it while the game runs.

A setting of type `integration-resource` lets the host pick one of their own things at a
connected provider (a Spotify playlist), listed by `GET /api/integrations/:provider/resources/:resource`;
`minItemsFromSetting` ties its minimum size to a number setting.
