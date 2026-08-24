# lobby

Client-side host/join lobby: join-form validation, a live player roster (via `@jostle/messaging`'s `sessionRosterTopic`), a presentational player list (reusing `@jostle/presence`'s `Avatar`), a kick control, and a QR-code join link. No MongoDB dependency — that lives in the separate `@jostle/game-sessions` package.

Structured as colocated per-domain folders (`join-form/`, `roster/`, `player-list/`, `kick-button/`, `join-code/`), each self-contained with its own types — mirrors `@jostle/presence`'s convention rather than `@jostle/notification-center`'s centralized one, since these pieces are each independently usable rather than being multiple views over one shared reducer.
