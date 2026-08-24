# game-catalog

Client-side game catalog browsing and the schema-driven `ConfigurationForm` — the polymorphic dispatcher that renders `Slider`/`Switch`/`Select`/`Input` from `@jostle/ui` based on a game's `defaultSettingsSchema`. No MongoDB dependency — that lives in the separate `@jostle/games` package.

Colocated per-domain folders (`catalog/`, `config-form/`, `session-config/`), mirroring `@jostle/lobby`'s convention rather than `@jostle/notification-center`'s centralized one. Deliberately has zero dependency on `@jostle/lobby` — browsing/configuring games is independent of session/roster concerns; the composing page (`apps/web/src/pages/host.tsx`) wires both together.
