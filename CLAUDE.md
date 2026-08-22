<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Jostle Architecture & Code Style

## Functional Programming

- Write functional-style code wherever possible: pure functions, composition, immutable data structures.
- Avoid classes and OOP patterns for business logic, utilities, and data transformations unless a framework requires them (e.g., Angular DI, error boundaries). Prefer function declarations/arrow functions.
- Avoid mutation; prefer returning new values (spread, `map`/`filter`/`reduce`, immutable updates) over mutating in place.

## Thin Apps, Logic in Packages

- The workspace has exactly two app entry points: the engagement platform (client) and the API. Both must stay thin — routing, transport, wiring/composition of packages only. No business logic in apps.
- All business logic lives in `packages/`. If you're writing non-trivial logic inside an app, it belongs in a package instead — stop and move it.

## Feature-Sliced Packages

- Packages are named and organized by feature/domain (feature-sliced), not by technical layer.
- Every package barrel-exports its full public API from a single root `index.ts`.
- Within a package, each sub-unit (component, module, hook, etc.) gets its own folder with its own `index.ts` barrel, re-exported from the package's root barrel. Example:

```
ui/
  index.ts
  input/
    index.ts
    input.tsx
  button/
    index.ts
    button.tsx
```

- Only import across package boundaries via a package's root barrel (`index.ts`) — never reach into another package's internal files directly.

## Reusability & Abstraction

- Favor reusable, composable building blocks over one-off implementations. Extract shared logic into packages rather than duplicating it across apps or other packages.
- Architect for heavy abstraction and scale: design packages/interfaces so features can be composed and reused across both apps, not just the app that first needed them.
