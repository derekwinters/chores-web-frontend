# CLAUDE.md — Developer and AI Agent Reference

This repo is the React frontend for chores-web. The FastAPI backend lives in
`derekwinters/chores-web-backend`; user-facing docs and the API contract
(golden `openapi.json` + `API_VERSION`) live in `derekwinters/chores-web-docs`.

## API Usage

All API routes are versioned under `/api/v1/`; nginx proxies `/api/` and the
unversioned `/status/` endpoints to the backend service. When the backend
introduces `/api/v{N+1}/`, migrate calls deliberately — the contract source
of truth is `chores-web-docs/docs/api/openapi.json`.

## Theming

All colors and visual primitives MUST use the CSS custom properties defined
in `src/index.css` (the 9-color theme system: background, surface, surface2,
primary, secondary, accent, error, success, warning). Never hardcode color
values in component CSS — runtime themes come from the backend and override
these variables.

## Releases

Versioning is automated with release-please (config under
`.github/release-please/`), which parses commit messages on `main` to
compute version bumps and changelogs. Releases publish
`ghcr.io/derekwinters/chores-web-frontend`.

**Every commit that lands on `main` MUST be a Conventional Commit** —
`type(scope): description`, with `type` one of `feat`, `fix`, `chore`,
`ci`, `docs`, `build`, `refactor`, `test`, `perf`, `revert`. This is a hard
requirement, not a description of how release-please happens to work.

Since PRs merge via squash, the squash-merge commit title IS the commit
release-please sees — so it must itself be conventional. Do not carry a
non-conventional PR title into the squash-merge title verbatim; rewrite it.
Pick `type` for the actual semver impact of the change (e.g. a new
user-facing capability is `feat` even if it incidentally fixes something),
never a vague or missing type. A merge with an unparseable type is
invisible to release-please: it drives no version bump and is dropped from
the changelog. This is exactly what happened with commit `e4a45de`
("Fix update checker to be client-side, own-repo; add Backend Version
section and repo links (#32)") — the PR title was squashed in as-is with
no `type:` prefix, so it landed unreleased and unaccounted for. Before
merging, check the proposed squash title yourself; don't assume it's
already conventional.

## Commit Work Must Be Delegated

An orchestrating/main Claude Code session must never author commits
itself. Writing the change, crafting the commit message, and opening the
PR are all implementation work and belong to a delegated implementation
agent. The orchestrating session's job is to delegate that work, review CI
results, and merge — applying the Conventional Commits rule above to
whatever squash-merge title it chooses at merge time.
