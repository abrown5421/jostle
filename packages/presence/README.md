# presence

Avatar + status-indicator system built on `@jostle/messaging`'s presence channel. State resolution (`deriveStatus`), idle tracking (`idle-detection`), and the stream subscription (`presence-stream`) are fully decoupled from the presentational `Avatar`/`PresenceLight` components — the components only ever take a `status` prop.

See `src/examples/connected-avatar.tsx` for how the pieces compose.
